# Codex Task 0045 - Selection + Inspector Panel: "What am I looking at?" (UX Clarity)

**Date:** 2026-02-14  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5

---

## Goal

Make interaction understandable:

- click to select a tile/coord
- selected state is visible on the board
- an Inspector panel shows the selected tile details and token counts
- ESC clears selection

No new rules. Presentation of existing state only.

---

## Inputs

- `GameLayout` currently tracks `selectedTileId`
- Board rendering (HexBoard + Viewport) exists from Tasks 0043-0044
- Tiles and objects are in `G.tiles`, `G.objects`, and tile zones are `G.zones[tileId]`

---

## Outputs

### A) Centralize selection on board coords

Update `packages/client-web/src/components/GameLayout.tsx`:

- Track selection as:
  - `selectedCoord: string | null`
  - `selectedTileId: string | null`
- `HexBoard` (or BoardViewport->HexBoard) should accept:
  - `selectedTileId` and/or `selectedCoord`
  - `onSelectTile(tileId, coordStr)` callback
- Clicking an occupied tile selects it.
- Clicking a ghost does NOT select; it places.

Add ESC handling:

- On `Escape` key, clear selection.
- Keep it UI-only (no move dispatched).

### B) Add Inspector panel

Update the right panel or add a dedicated panel section in `GameLayout`:

Inspector displays (for selected tile):

- coord string (q,r)
- tile fields: `type`, `resort`, `weight`
- token counts on that tile:
  - influence count by owner
  - resource count by resort

Optional (preferred if available as an exported helper, not duplicated):
- show computed controller/majority (import helper from `@balance-control/game` if present)

### C) Improve selection visuals

Ensure selected tiles are clearly styled (Task 0042 baseline). If needed, add a selection marker overlay in the board component.

### D) Tests

Add RTL tests:

- Clicking an occupied tile updates Inspector content.
- Pressing `Escape` clears selection and resets Inspector.

### E) Bookkeeping

- Add this file: `docs/tasks/0045-selection-and-inspector-panel.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0045)
- Update `CHANGELOG.md` (Unreleased):
  - Client: board selection + inspector panel for tile details and token counts.

---

## Constraints

- Do not add legality computation in UI.
- If showing controller/majority, import the engine helper; do not reimplement the algorithm in client.

---

## Invariants

- Inspector reflects state only; it must not enable illegal actions.
- No engine logic changes.

---

## Acceptance Criteria

1. You can click a tile and instantly see what it is and what is on it.
2. ESC clears selection.
3. `pnpm -w test` is green.

---

## PR Checklist

- [ ] Board selection state (tile + coord) wired through layout and board
- [ ] Inspector panel shows tile details + token counts
- [ ] ESC clears selection
- [ ] Tests for selection + inspector + ESC
- [ ] Update `docs/PR_TASK_LIST.md`
- [ ] Update `CHANGELOG.md` (Unreleased)
- [ ] CI green

---

## Work Summary

(Replace this section at the end with 3-7 bullets: what changed + why.)

---

## Commands Run

(Replace this section at the end with the exact commands executed and outcomes.)
