# /docs/tasks/0058-hex-tile-frame-base-renderer.md

# Codex Task 0058 - HexTileFrame (SVG base ring + inner disc + majority fill)

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS
- Determinism: engine unchanged

---

## Goal

Implement the **base HexTile SVG renderer** (no overlay PNG, no markers yet):

- outer hex background fill = influence majority color, else dark gray
- inner disc (neutral)
- content placeholder area (resort icon hook, optional W value hook)

This is the foundation for later layers.

---

## Inputs

- `packages/client-web/src/assets/tiles/base_tile.svg`
- `packages/client-web/src/ui/tiles/tileGeometry.ts`

---

## Outputs

Create:

- `packages/client-web/src/ui/tiles/HexTileFrame.tsx`

Responsibilities:

- Render `<svg viewBox="0 0 747 864">`
- Draw:
  - Base hex shape (from `base_tile.svg` or equivalent extracted path)
  - Inner disc circle
- Apply majority fill (input prop)

Props (minimum):

```ts
type SeatId = 1|2|3|4|5|6;

type HexTileFrameProps = {
  majoritySeat: SeatId | null;
  seatColor: (seat: SeatId) => string;  // returns CSS color value
  className?: string;
};
```

---

## Constraints

- No overlay PNG in this task.
- No influence markers or badges in this task.
- No client legal logic: `majoritySeat` is provided by the caller (selector/UI mapping).

---

## Invariants

- Canonical viewBox is 747x864.
- Stroke widths follow the spec defaults (base outline, inner disc outline), using stable values.

---

## Acceptance Criteria

- Frame renders correctly at multiple CSS sizes (e.g., 48px, 96px, 160px height).
- When `majoritySeat=null`, base fill is `#0B0B0D`.
- When `majoritySeat=seatX`, base fill matches `seatColor(seatX)`.

---

## PR Checklist

- [ ] Frame uses canonical viewBox and geometry constants
- [ ] No overlay/markers/badges included yet
- [ ] No engine code touched
