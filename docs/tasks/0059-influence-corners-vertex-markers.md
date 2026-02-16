# /docs/tasks/0059-influence-corners-vertex-markers.md

# Codex Task 0059 - InfluenceCorners (vertex-centered markers, hover/selected reveal, capsule expand)

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS
- No client legal move logic

---

## Goal

Render the **influence corner markers** exactly as per spec:

- marker centers are EXACTLY on the hex vertices (seat1..seat6)
- markers are hidden when not hovered/selected
- when visible: show influence number + ALL meta icons
- if metaCount>0: expand marker into capsule outward (radial)

---

## Inputs

- `packages/client-web/src/ui/tiles/tileGeometry.ts`

---

## Outputs

Create:

- `packages/client-web/src/ui/tiles/InfluenceCorners.tsx`

Props (minimum):

```ts
type SeatId = 1|2|3|4|5|6;

type InfluenceCornersProps = {
  isHovered: boolean;
  isSelected: boolean;
  influenceBySeat: Partial<Record<SeatId, number>>;
  metaIconsBySeat: Partial<Record<SeatId, React.ReactNode[]>>;
  seatColor: (seat: SeatId) => string;
};
```

Rules:

- Layer MUST have `pointer-events: none` (avoid hover flicker).
- Tile root MUST allow overflow visible (markers stick out beyond viewBox).
- Marker visibility: `isHovered || isSelected`.
- Capsule orientation: along outward radial direction (center -> vertex).

---

## Constraints

- No engine changes.
- No attempt to compute legality; render only.

---

## Invariants

- Marker centers are from `INFLUENCE_MARKER_CENTERS_ABS` constants (no offsets).
- Marker radius + stroke width are from constants (spec v0.2).
- Text uses tabular numbers if possible (CSS `font-variant-numeric: tabular-nums`).

---

## Acceptance Criteria

- Non-hover + non-selected: marker layer is not visible.
- Hover or selected: marker shows number for each seat that has influence or meta icons.
- For meta icons:
  - render ALL icons (no "+" summary in hover/selected mode).
  - capsule width uses the spec formula (label gap + icon size + icon gap).

---

## PR Checklist

- [ ] Marker centers are exactly on vertices (no inset)
- [ ] pointer-events disabled on marker layer
- [ ] Capsule expansion and rotation are correct
- [ ] No engine packages touched
