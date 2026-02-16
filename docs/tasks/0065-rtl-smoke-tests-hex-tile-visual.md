# /docs/tasks/0065-rtl-smoke-tests-hex-tile-visual.md

# Codex Task 0065 - Tests: RTL smoke for HexTileVisual (render matrix)

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS

---

## Goal

Add lightweight, real tests to prevent regressions:

- HexTileVisual renders without crashing
- hover/selected toggles marker visibility
- overlay layer mounts
- badge mode switches (compact vs belt)

---

## Inputs

- `HexTileVisual` (Task 0062)

---

## Outputs

Add tests in `packages/client-web`:

- `packages/client-web/src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx`

Test cases (minimum):

1) Render with majoritySeat=null, no badges, no markers.
2) Render with majoritySeat=1, hover=false selected=false => marker layer hidden.
3) Render with hover=true => marker layer visible and includes numbers.
4) Render with metaIconsBySeat for one seat => capsule expands (assert via presence of `<rect>` or width attr).
5) Badges:
   - 2 badges => compact mode (only 2 slots used)
   - 4 badges => belt mode (more slots used)

Use robust queries (avoid brittle snapshots unless already standard in repo).

---

## Constraints

- Do not test engine logic.
- Keep tests fast.

---

## Invariants

- Tests reference canonical props and constants; no hardcoding of DOM order beyond what is required.

---

## Acceptance Criteria

- Tests pass in CI locally.
- Tests fail if marker visibility breaks or badge mode switch breaks.

---

## PR Checklist

- [ ] Tests are deterministic and stable
- [ ] No engine packages touched
