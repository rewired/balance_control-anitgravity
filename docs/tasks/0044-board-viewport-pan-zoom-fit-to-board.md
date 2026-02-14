# Codex Task 0044 - Board Viewport: Pan/Zoom + Fit-to-Board (Playable Camera)

**Date:** 2026-02-14  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Determinism (engine): AGENTS 0.2
- Client is presentation only: ARCH-01, AGENTS 1.5
- Use NPM solutions where useful: AGENTS 0.3

---

## Goal

Make the board actually playable:

- pan and zoom (mouse drag + wheel)
- "fit to board" on load and whenever bounds change
- reset view control

Camera/UI only; no engine changes.

---

## Inputs

- Task 0043 provides `HexBoard` rendering in pixel space and a bounds helper (`computeBounds` or equivalent).
- Current `GameLayout` renders the board in the center panel.

---

## Outputs

### A) Add a maintained pan/zoom dependency

Add to `packages/client-web`:

- `react-zoom-pan-pinch` (recommended) or another maintained equivalent

Update `package.json` and lockfile accordingly.

### B) Implement viewport wrapper

Add: `packages/client-web/src/components/BoardViewport.tsx`

- Wrap `HexBoard` in the pan/zoom provider/component.
- Provide:
  - wheel zoom enabled
  - drag-to-pan enabled
  - sensible min/max scale (example 0.25..2.5)
- Add a small overlay button: "Reset view"

### C) Fit-to-board algorithm (pure helper + unit tests)

Add: `packages/client-web/src/ui/fitToBounds.ts` (pure)

- `computeFitTransform(bounds, viewportSize, paddingPx) -> { scale, x, y }`
- Deterministic math only; no DOM calls in the helper.
- Add unit tests for expected outputs on known bounds + viewport sizes.

Note: jsdom layout sizes are unreliable; tests must target the pure helper, not DOM measurement.

### D) Integrate fit-to-board into the viewport

- On first render and when bounds change, compute the fit transform and apply it via the pan/zoom library API.
- Avoid `setTimeout` hacks. Prefer library init callbacks if required.

### E) Wire into layout

Update `packages/client-web/src/components/GameLayout.tsx`:

- Replace direct `HexBoard` usage with `BoardViewport` wrapping it.

### F) Bookkeeping

- Add this file: `docs/tasks/0044-board-viewport-pan-zoom-fit-to-board.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0044)
- Update `CHANGELOG.md` (Unreleased):
  - Client: board camera with pan/zoom + fit-to-board.

---

## Constraints

- No time-based behavior required for correctness (no animation timers).
- Keep fit computation pure and covered by unit tests.
- No changes to engine rules.

---

## Invariants

- Camera does not affect legality or move resolution.
- Interaction remains deterministic in the engine; camera state may be local UI state.

---

## Acceptance Criteria

1. In dev: you can zoom out to see the cluster, pan freely, and reset view.
2. Fit-to-board frames the current placed tiles + ghosts with padding.
3. `pnpm -w test` is green.

---

## PR Checklist

- [ ] Add pan/zoom dependency (maintained)
- [ ] Add `BoardViewport` wrapper with reset control
- [ ] Add pure `fitToBounds` helper + unit tests
- [ ] Wire viewport into `GameLayout`
- [ ] Update `docs/PR_TASK_LIST.md`
- [ ] Update `CHANGELOG.md` (Unreleased)
- [ ] CI green

---

## Work Summary

(Replace this section at the end with 3-7 bullets: what changed + why.)

---

## Commands Run

(Replace this section at the end with the exact commands executed and outcomes.)
