# /docs/tasks/0061-glass-overlay-png-layer.md

# Codex Task 0061 - GlassOverlay layer (PNG in SVG, 748x865 -> 747x864)

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS

---

## Goal

Add the PNG glass overlay as an SVG `<image>` layer:

- PNG source is 748x865
- It is rendered into tile space rect 0,0,747,864 with `preserveAspectRatio="none"`
- Markers and badges MUST remain above this layer (z-order)

---

## Inputs

- `packages/client-web/src/assets/tiles/tile-overlay.png`
- `packages/client-web/src/ui/tiles/tileGeometry.ts`
- `packages/client-web/src/ui/tiles/HexTileFrame.tsx` (Task 0058)

---

## Outputs

Create:

- `packages/client-web/src/ui/tiles/GlassOverlay.tsx`

Update:

- `HexTileFrame.tsx` OR a new composition component to insert overlay at layer L3.

Implementation notes:

- Import PNG as URL (Vite):
  - `import overlayUrl from "../assets/tiles/tile-overlay.png";`
- Render:
  - `<image href={overlayUrl} x={0} y={0} width={747} height={864} preserveAspectRatio="none" />`

---

## Constraints

- No markers/badges added here.
- No engine changes.

---

## Invariants

- Overlay render rect matches spec v0.2 exactly.
- Overlay is visually above content but below markers/badges.

---

## Acceptance Criteria

- Overlay appears aligned with base tile across multiple tile sizes.
- No clipping (tile SVG allows overflow visible; overlay itself stays within viewBox).

---

## PR Checklist

- [ ] PNG is rendered with exact rect and preserveAspectRatio="none"
- [ ] Z-order ensures markers/badges render above overlay
- [ ] No engine packages touched
