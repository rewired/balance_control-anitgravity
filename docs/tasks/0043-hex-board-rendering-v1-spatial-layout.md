# Codex Task 0043 - Hex Board Rendering v1: Spatial Layout for Tiles + Ghost Targets

**Date:** 2026-02-14  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Determinism (engine): AGENTS 0.2
- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5
- Hex topology contract: AGENTS 1.4

---

## Goal

Replace the current "flex-wrapped list of coords" with a real spatial hex board:

- tiles and ghost placement targets appear at their axial (q,r) positions
- clicking a ghost places the staged tile (by dispatching the existing legal intent payload)
- deterministic rendering order is preserved

No new rules. No new move logic.

---

## Inputs

- `packages/client-web/src/components/BoardGrid.tsx` (current non-spatial rendering)
- Legal intents already exist and include `placeTile` with `payload.targetCoord`
- `G.grid` keys are `"q,r"` axial coords (string)

---

## Outputs

### A) Add pure layout helper (no React, no DOM)

Add: `packages/client-web/src/ui/hexLayout.ts`

- `parseCoordString("q,r") -> { q: number, r: number }`
- `axialToPixel({ q, r }, hexSize) -> { x: number, y: number }`
- `computeBounds(coords, hexSize) -> { minX, minY, maxX, maxY }`
- `stableSortCoords(coordStrings) -> string[]` (lexicographic)

Pick one orientation (pointy-top OR flat-top) and document the formula in comments. Be consistent everywhere.

### B) Add a spatial board component

Add: `packages/client-web/src/components/HexBoard.tsx`

Responsibilities:

- Render occupied tiles at computed pixel positions.
- Render ghost targets at computed pixel positions (same coordinate space).
- Deterministic ordering:
  - occupied coords sorted lexicographically
  - ghost coords sorted lexicographically
- Provide test ids:
  - `data-testid="hex-tile-q_r"` and `data-testid="hex-ghost-q_r"` (underscore, not comma)

Implementation notes:

- Use absolute positioning inside a relative container.
- Reuse existing `Tile` component for occupied cells.
- Ghosts are buttons (or divs) with clear affordance; clicking dispatches exactly one move call.

### C) Wire into layout

Update `packages/client-web/src/components/GameLayout.tsx`:

- Replace `BoardGrid` usage with `HexBoard` (keep props as needed: `G`, `moves`, `intents`, selection callback).

### D) CSS for spatial board

Update `packages/client-web/src/index.css`:

- Add `.hex-board`, `.hex-layer`, `.hex-cell` styles.
- Ghosts must look like valid placement targets (outlined shape, hover glow).
- Keep it minimal and readable.

### E) Tests

Add tests (no DOM measurement needed):

- Unit tests for `hexLayout.ts`:
  - `axialToPixel` deterministic for known coords
  - `computeBounds` returns expected min/max for a small coord set
- One RTL test:
  - renders a ghost with `data-testid="hex-ghost-q_r"`
  - clicking it calls the provided move dispatcher with the exact payload

### F) Bookkeeping

- Add this file: `docs/tasks/0043-hex-board-rendering-v1-spatial-layout.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0043)
- Update `CHANGELOG.md` (Unreleased):
  - Client: spatial hex board rendering for tiles + placement ghosts.

---

## Constraints

- Do NOT recompute legal placement targets in the client. Only render those provided via legal intents.
- Keep layout helper pure (no `window`, no `Date`, no randomness).
- No new dependencies in this task.

---

## Invariants

- UI renders from `G.grid` + `intents` only.
- Clicking a ghost dispatches exactly one `moves.placeTile(payload)`.

---

## Acceptance Criteria

1. In dev, the board looks like a board: tiles occupy stable positions; ghosts surround the cluster.
2. Clicking a ghost places the staged tile at that coord.
3. `pnpm -w test` is green.

---

## PR Checklist

- [ ] Add `ui/hexLayout.ts` (pure + tested)
- [ ] Add `HexBoard` component rendering tiles + ghosts spatially
- [ ] Wire `HexBoard` into `GameLayout`
- [ ] Add CSS for spatial board + ghost affordance
- [ ] Add tests (layout unit + minimal RTL click)
- [ ] Update `docs/PR_TASK_LIST.md`
- [ ] Update `CHANGELOG.md` (Unreleased)
- [ ] CI green

---

## Work Summary

(Replace this section at the end with 3-7 bullets: what changed + why.)

---

## Commands Run

(Replace this section at the end with the exact commands executed and outcomes.)
