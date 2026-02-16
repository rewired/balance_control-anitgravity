# /docs/tasks/0057-client-assets-and-geometry-constants.md

# Codex Task 0057 - Client Assets + Geometry Constants (HexTile canonical space)

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS
- State shape consistency: ARCH-02

---

## Goal

Mirror the HexTile UI contract into **runtime constants** used by `packages/client-web`, so later components do not re-derive geometry.

---

## Inputs

- `docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml` (from Task 0056)

---

## Outputs

Create / update:

- `packages/client-web/src/assets/tiles/base_tile.svg`
- `packages/client-web/src/assets/tiles/tile-overlay.png`

- `packages/client-web/src/ui/tiles/tileGeometry.ts` (single source of truth for runtime)
  - `VIEWBOX = [0,0,747,864]`
  - `CENTER_ABS`
  - `INNER_DISC_RADIUS`
  - `INFLUENCE_MARKER_CENTERS_ABS` (seat1..seat6)
  - `BADGE_SLOTS` (compact + belt, centers + rot_deg)
  - `MARKER_RADIUS`, `MARKER_STROKE_WIDTH`
  - `BADGE_SIZE`, `BADGE_CORNER_RADIUS`
  - `OVERLAY_RENDER_RECT` (x,y,w,h, preserveAspectRatio)

- `packages/client-web/src/ui/tiles/types.ts` (if you do not already have a tile UI types module)
  - seat type `1|2|3|4|5|6`
  - badge and meta icon types (UI-only)

---

## Constraints

- No engine changes.
- Do not implement rendering yet (this task is only assets + constants + types).

---

## Invariants

- All constants must match the YAML spec exactly (copy numbers, do not recompute).
- Paths must be stable (no temporary folders, no duplicate assets).

---

## Acceptance Criteria

- Assets are importable in Vite/React:
  - `import overlayUrl from ".../tile-overlay.png"`
  - `import BaseTileSvg from ".../base_tile.svg?react"` (if svgr is used) OR url import if not
- Geometry constants compile and are used by later tasks.

---

## PR Checklist

- [ ] Constants match spec v0.2 exactly
- [ ] No duplicate/unused assets added
- [ ] No engine packages touched
