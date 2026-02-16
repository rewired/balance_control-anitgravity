# /docs/tasks/0064-viewport-stability-pass.md

# Codex Task 0064 - Viewport stability pass (pan/zoom + crispness safeguards)

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS
- Use NPM solutions where useful: AGENTS

---

## Goal

Ensure the new HexTile rendering remains stable under pan/zoom:

- avoid clipping
- avoid hover flicker
- reduce blur artifacts where practical

This task is a "stability pass" only; do not redesign visuals.

---

## Inputs

- Existing board viewport implementation (pan/zoom) in `packages/client-web`
- `HexTileVisual` integrated on the board (Task 0063)

---

## Outputs

Update CSS / container setup as needed:

- Ensure the immediate tile container and board layers do not apply `overflow:hidden` that clips protruding markers.
- Ensure marker and badge layers use `pointer-events:none` where appropriate.
- Add safe performance hints:
  - `will-change: transform` on pan/zoom container
  - avoid unnecessary CSS filters on tiles

If a pan/zoom library is already installed and working, do NOT replace it.
If none exists, add a minimal, maintained dependency (only if needed) and wrap the board.

---

## Constraints

- No engine changes.
- No new mechanics.

---

## Invariants

- Board transforms remain deterministic and purely presentational.
- Tile SVG remains canonical viewBox.

---

## Acceptance Criteria

- No marker clipping during pan/zoom.
- Hover does not flicker when cursor crosses protruding markers.
- Zoomed board remains usable; visuals remain consistent.

---

## PR Checklist

- [ ] No pan/zoom regression
- [ ] No clipping regressions
- [ ] No engine packages touched
