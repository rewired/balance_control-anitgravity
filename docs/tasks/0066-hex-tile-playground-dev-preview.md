# /docs/tasks/0066-hex-tile-playground-dev-preview.md

# Codex Task 0066 - Dev preview: HexTile playground scene (manual QA at zoom levels)

**Date:** 2026-02-16  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)  
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Client is presentation only: ARCH-01, AGENTS

---

## Goal

Add an easy manual QA entry point for HexTile visuals:

- a small in-app dev route or dev-only panel
- shows multiple tiles in a grid
- includes a zoom slider (or uses existing board zoom)
- allows toggling hover/selected states via UI controls

This is for human verification (crispness, layering, clipping).

---

## Inputs

- `HexTileVisual` (Task 0062)

---

## Outputs

Add one of the following (choose what matches repo conventions best):

Option A) Dev route/page:
- `packages/client-web/src/dev/HexTilePlayground.tsx`
- register route in existing dev router (if present)

Option B) Storybook story (only if Storybook exists in repo):
- `packages/client-web/src/ui/tiles/HexTileVisual.stories.tsx`

The playground MUST include:

- at least 6 tiles with different majoritySeat values
- hover/selected toggles
- badges in compact and belt modes
- metaIcons in several seats

---

## Constraints

- No engine changes.
- Do not ship dev-only UI into production builds if the repo has a production build mode (guard with env flag if needed).

---

## Invariants

- Uses the same HexTileVisual component as the board (no forked rendering).

---

## Acceptance Criteria

- A developer can open the playground and visually verify:
  - overlay alignment
  - markers above overlay
  - no clipping
  - badge slots correct

---

## PR Checklist

- [ ] Playground is reachable in dev mode
- [ ] No production bundle pollution (if applicable)
- [ ] No engine packages touched
