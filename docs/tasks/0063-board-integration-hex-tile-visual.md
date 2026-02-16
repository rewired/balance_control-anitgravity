# /docs/tasks/0063-board-integration-hex-tile-visual.md

# Codex Task 0063 - Board integration: replace debug/card tiles with HexTileVisual

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS

---

## Goal

Replace the current tile rendering on the board with the composed `HexTileVisual`.

This is UI-only. No engine changes.

---

## Inputs

- `packages/client-web/src/ui/tiles/HexTileVisual.tsx`

---

## Outputs

Update the board rendering in `packages/client-web` where tiles are currently drawn as cards/debug panels.

- Replace old component usage with `HexTileVisual`.
- Ensure:
  - tile wrapper allows `overflow: visible` (marker protrusion)
  - pointer events for tile selection remain on the wrapper (not markers)

Add (if missing):

- `packages/client-web/src/ui/tiles/seatColor.ts` (or integrate into existing theming)
  - maps seat -> CSS var color, used by `seatColor(seat)`

---

## Constraints

- No engine changes.
- Do not add client legality checks.
- Do not change board coordinate math beyond what is required to mount the tile.

---

## Invariants

- Tile size is controlled by the board layout (CSS). SVG scales accordingly.
- Markers do not capture pointer events.

---

## Acceptance Criteria

- Tiles appear as hex tokens, not cards.
- Majority fill updates correctly per tile.
- Hover/selected reveal works on the board.
- No clipping of protruding markers.

---

## PR Checklist

- [ ] Old tile renderer fully removed from board path
- [ ] No clipping / overflow issues in board container
- [ ] No engine packages touched
