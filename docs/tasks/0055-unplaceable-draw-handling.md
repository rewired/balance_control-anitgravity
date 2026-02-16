# Codex Task 0055 - Unplaceable Draw Handling: Public Notice + Forced Confirm + Redraw Loop

**Date:** 2026-02-16
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5
- State shape: ARCH-02
- Determinism: AGENTS 0.2
- Core rules: `/docs/rules/000-core.md` (CORE-01)
  - CORE-01-04-06: Unplaceable drawn tile -> DiscardFaceUp
  - CORE-01-04-07: Then draw again

---

## Goal

When a tile is drawn but has **no legal placement**:
1) It is immediately moved to `DiscardFaceUp`.
2) ALL players see a public notice (and the tile, now face-up).
3) The drawing player must explicitly confirm (“OK”).
4) After confirm, the engine draws the next tile automatically (repeat until placeable or bag empty).

This must be deterministic and enforced engine-side (no client-side legality computation).

---

## Inputs

- Task 0054 landed:
  - DrawPile is closed in playerView.
  - DiscardFaceUp is visible in UI.
- Engine already has `enumerateLegalIntents` and `pendingChoice` mechanics.
- There is an existing choice resolution move (`resolveChoice`).

---

## Outputs

### A) Engine: Detect unplaceable drawn tile and schedule confirm-gated redraw

Implement deterministic handling:

1) Trigger point:
   - After a tile is drawn into the current player’s staging (or immediately after any “draw tile” action),
     run an engine-side check: “exists at least one legal `placeTile` intent for the staged tile”.

2) If no legal placement exists:
   - Move staged tile to `DiscardFaceUp` (CORE-01-04-06).
   - Append a public notice entry (engine state, visible to all):
     - Store in `G.engine.attributes.publicLog` (append-only, cap to last 20).
     - Entry example:
       `{ id, kind: "tile.unplaceable", playerId, tileId }`
   - Create a forced pending choice for the drawing player:
     - kind: `selectOption`
     - single option: “OK”
   - On resolving that choice, engine automatically draws the next tile (CORE-01-04-07),
     then re-runs the same legality check (loop).

3) Blocking:
   - While this pending choice exists, only `resolveChoice` must be legal for that player.

Implementation notes:
- Keep draw logic centralized and deterministic.
- Avoid circular imports; factor draw helper if needed.

Engine tests:
- Add `packages/game/test/unplaceable-draw-redraw.test.ts`
  - Create a state where placement is impossible (e.g. prohibitions block placeTile or board has no legal slots).
  - Assert: tile moved to DiscardFaceUp, publicLog entry added, pendingChoice created.
  - Resolve “OK”: assert a new draw occurs (or stops cleanly if DrawPile empty).
  - Assert: no other intents are legal during pendingChoice.

---

### B) UI: Public notice overlay (all players) + confirm only for drawer

Add:
- `packages/client-web/src/components/PublicNoticeOverlay.tsx`

Behavior:
- Reads `G.engine.attributes.publicLog`.
- For newest `kind="tile.unplaceable"` entry:
  - Show message: “Player X drew a tile that cannot be placed. It was discarded face-up.”
  - Render the tile (it is now in DiscardFaceUp, so UI can render it normally).
  - Only the drawing player sees the confirm control (through existing pendingChoice UI).
  - Others see info only.

Wire into `GameLayout` near the top-level so it overlays regardless of panels.

UI tests:
- Add `packages/client-web/test/public-notice-unplaceable.test.tsx`
  - Non-drawer: sees message, no confirm button.
  - Drawer: sees message + confirm via existing pendingChoice renderer (smoke test).

---

## Constraints

- No client-side legality computation.
- Must remain deterministic and replayable.
- Do not change rules semantics; confirmation is UX gating, not a rules change.

---

## Invariants

- Unplaceable tile is always moved to DiscardFaceUp before any redraw.
- Public notice is visible to all.
- During pendingChoice, only `resolveChoice` is legal.

---

## Acceptance Criteria

1) If a drawn tile has no legal placement, all players get the notice and see the tile in DiscardFaceUp.
2) The drawing player must confirm; only after confirmation does the next draw occur.
3) Loop repeats until a placeable tile is drawn or DrawPile is empty.
4) `pnpm -w test` is green.

---

## PR Checklist

- [ ] Engine: unplaceable draw detection + discard + publicLog + pendingChoice + confirm-gated redraw loop
- [ ] Engine tests: unplaceable-draw-redraw coverage
- [ ] UI: PublicNoticeOverlay for publicLog entries
- [ ] UI tests: overlay behavior for drawer vs others
- [ ] Update `docs/PR_TASK_LIST.md` (add Task 0055)
- [ ] Update `CHANGELOG.md` (Unreleased)
- [ ] CI green
