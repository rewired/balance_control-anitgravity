# /docs/tasks/0060-badge-slots-compact-vs-belt.md

# Codex Task 0060 - BadgeSlots (compact vs belt) fixed positions + rotations

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS

---

## Goal

Implement tile badges in **fixed slots**:

- If badgeCount <= 2: use compact slots (TL_T then T_TR)
- If badgeCount > 2: use belt slots (6 edges)
- Each slot has fixed center + rotation angle from the spec

Badges are a UI overlay layer that MUST be above the glass overlay later.

---

## Inputs

- `packages/client-web/src/ui/tiles/tileGeometry.ts`

---

## Outputs

Create:

- `packages/client-web/src/ui/tiles/BadgeSlots.tsx`

Props (minimum):

```ts
type TileBadge = {
  key: string;
  icon: React.ReactNode;
  tone?: "neutral" | "warn" | "danger";
};

type BadgeSlotsProps = {
  badges: TileBadge[];
  isHovered?: boolean;   // optional for future behavior; do not hide badges by default
  isSelected?: boolean;
};
```

Behavior:

- Slots chosen deterministically by `badges.length`.
- Render badges in stable order (input array order) into slot order.
- If more badges than slots: render up to slots.length, ignore the rest (or render an overflow "+" badge if you prefer, but keep deterministic).

---

## Constraints

- No engine changes.
- No CSS filters / glow spam.

---

## Invariants

- Slot centers and rotations come from constants and match spec v0.2 exactly.
- Badge shapes use spec sizes and corner radii (from constants).

---

## Acceptance Criteria

- With 0 badges: renders nothing.
- With 1-2 badges: uses compact slots only.
- With 3+ badges: uses belt slots.
- All badges remain visible under zoom/pan without clipping (tile root overflow visible; badges are inside the ring so typically safe).

---

## PR Checklist

- [ ] Slot mapping matches spec exactly
- [ ] Deterministic ordering (no random layout)
- [ ] No engine packages touched
