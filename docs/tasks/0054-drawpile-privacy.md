# Codex Task 0054 - DrawPile Privacy (Closed Bag) + UI: Draw Count Widget + DiscardFaceUp

**Date:** 2026-02-16
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5
- State shape: ARCH-02
- Determinism: AGENTS 0.2
- Core rules: `/docs/rules/000-core.md` (CORE-01)
  - DrawPile is a closed bag exception
  - DiscardFaceUp is face-up

---

## Goal

1) Enforce DrawPile as **closed bag** at the `playerView` boundary (no IDs, no tile defs leakage).
2) UI shows DrawPile as **count-only widget** (no `Zone` renderer for DrawPile).
3) UI shows `DiscardFaceUp` as a visible zone (face-up).

---

## Inputs

- Client currently renders `DrawPile` via `<Zone zoneId="DrawPile" />`, exposing remaining tiles.
- `buildPlayerView` currently does not mask DrawPile contents, so clients can infer the bag.
- Web uses `packages/game/src/client-game.ts`; server/build uses `packages/game/src/index.ts`.

---

## Outputs

### A) Engine: Harden `playerView` (DrawPile masking + hidden tile defs)

Update BOTH:
- `packages/game/src/index.ts`
- `packages/game/src/client-game.ts`

Implement in `buildPlayerView`:

1) DrawPile masking:
   - Keep `G.zones.DrawPile` present.
   - Replace `DrawPile.items` with placeholder IDs of same length.
   - Placeholders MUST NOT match any real object/tile IDs.

2) Tile definition filtering:
   - Do not expose tile defs that exist only in hidden zones (incl. DrawPile).
   - Replace `tiles: G.tiles` with a filtered map containing ONLY tiles referenced by visible zones
     (Board, DiscardFaceUp, and the current player’s visible zones as currently defined).

3) Preserve existing privacy rules (other players’ hidden zones, pendingChoice non-owner, etc.).

Tests:
- Update/add `packages/game/test/player-view.test.ts`
  - DrawPile count preserved.
  - DrawPile IDs are placeholders (not real).
  - Hidden tiles are absent from `view.tiles`.

---

### B) UI: Replace DrawPile Zone with closed-bag widget; show DiscardFaceUp

Update:
- `packages/client-web/src/components/GameLayout.tsx`

1) Remove rendering of `Zone` for DrawPile.
2) Add a compact widget:
   - Label: “Draw Bag” (or “Draw Pile”)
   - Count: `G.zones.DrawPile.items.length` (safe after masking)
3) Render `Zone` for `DiscardFaceUp` beneath the widget
   - Title: “Discard (Face Up)”

UI tests (RTL):
- Add `packages/client-web/test/drawpile-and-discard-ui.test.tsx`
  - DrawPile shows count and does not render tiles.
  - DiscardFaceUp renders tiles.

---

## Constraints

- Engine remains deterministic.
- Privacy must be enforced engine-side (playerView), not “UI hiding”.
- Update both entrypoints to avoid drift (`index.ts` and `client-game.ts`).

---

## Invariants

- DrawPile contents MUST NOT be reconstructible from view state.
- DiscardFaceUp remains visible and accurate.

---

## Acceptance Criteria

1) DrawPile is displayed as count-only in UI.
2) DiscardFaceUp is visible in UI and renders tiles.
3) PlayerView does not leak real DrawPile IDs or tile defs.
4) `pnpm -w test` is green.

---

## PR Checklist

- [ ] PlayerView: mask DrawPile items (keep count)
- [ ] PlayerView: filter hidden tile defs
- [ ] UI: replace DrawPile zone with count widget
- [ ] UI: add DiscardFaceUp zone
- [ ] Tests: game + client-web
- [ ] Update `docs/PR_TASK_LIST.md` (add Task 0054)
- [ ] Update `CHANGELOG.md` (Unreleased)
- [ ] CI green
