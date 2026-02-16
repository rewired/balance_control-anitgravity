# /docs/tasks/0062-hex-tile-visual-composition.md

# Codex Task 0062 - HexTileVisual composition (frame + content + overlay + markers + badges)

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS

---

## Goal

Create the final composed HexTile component used by the board:

- frame (majority fill + inner disc)
- tile content hooks (resort icon, optional W)
- glass overlay
- influence corners (hover/selected reveal)
- badge slots

The component must expose a stable prop API and manage hover/selected CSS/data attributes.

---

## Inputs

- Task 0058: `HexTileFrame`
- Task 0061: `GlassOverlay`
- Task 0059: `InfluenceCorners`
- Task 0060: `BadgeSlots`

---

## Outputs

Create:

- `packages/client-web/src/ui/tiles/HexTileVisual.tsx`

Minimum props:

```ts
type SeatId = 1|2|3|4|5|6;

type HexTileVisualProps = {
  majoritySeat: SeatId | null;
  seatColor: (seat: SeatId) => string;

  isHovered: boolean;
  isSelected: boolean;

  influenceBySeat: Partial<Record<SeatId, number>>;
  metaIconsBySeat: Partial<Record<SeatId, React.ReactNode[]>>;

  badges: Array<{ key: string; icon: React.ReactNode; tone?: "neutral"|"warn"|"danger" }>;

  resortIcon?: React.ReactNode;
  valueW?: number;
  className?: string;
};
```

Implementation:

- Single `<svg viewBox="0 0 747 864" style={{ overflow: 'visible' }}>`
- Use deterministic DOM order for layers:
  - frame
  - content
  - overlay
  - markers
  - badges
  - interaction outlines (if any)

---

## Constraints

- No engine changes.
- No client legal move logic.

---

## Invariants

- Canonical viewBox and geometry constants are used everywhere.
- Marker/badge layers are above overlay.
- Marker layer `pointer-events: none`.

---

## Acceptance Criteria

- Non-hover + non-selected: markers hidden.
- Hover or selected: markers visible (number + all meta icons).
- Badges appear in correct slots and do not drift with hover.

---

## PR Checklist

- [ ] Layering order matches spec
- [ ] Single SVG, canonical viewBox
- [ ] No engine packages touched
