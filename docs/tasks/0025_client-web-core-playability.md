# Codex Task 0025 — Client-Web Core Playability (Hotseat MVP)

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Determinism: AGENTS 0.2
* Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
* Turn structure: CORE-01-04
* Start Committee restrictions: CORE-01-08-04 .. 08-06

---

### Goal

Make the **web client** playable for a complete **CORE-only** game loop (hotseat):

* Draw → place tile (staging → board)
* Political action (at least **PlaceInfluence**) → end turn
* Repeat until end condition triggers

No new mechanics. Just correct UX wiring for the already-implemented engine.

---

### Inputs

* `packages/game` stages + moves:

  * stage `drawAndPlace`: `placeTile`, `passTilePlacement`
  * stage `politicalAction`: `placeInfluence`, `moveInfluence`, `formalizeInfluence`, `convertResources`, `pass`
* `G.grid` (coord -> tileId) and `staging_<pid>` zones
* Existing client components:

  * `packages/client-web/src/components/*`
  * `Controls.tsx` currently hardcoded to `tile_start_committee` (must be fixed)

Optional visual reference for icons (later / nice-to-have):

* Canonical icon mapping file (Material Symbols):

---

### Outputs

#### A) Board rendering that understands coordinates

eb`:

* Replace the current “Board = Zone list” with a `BoardGrid` view derived from `G.grid`:

  * Deterministic ordering (sort coord keys lexicographically)
  * Each placed tile shows:

    * tile type + resort + weight
    * tokens on that tile zone
    * **its coord** (so humans can reason about placements)

#### B) Stage-aware controls (no illegal defaults)

Update `Controls.tsx`:

* If stage == `drawAndPlace`:

  * Show the currently staged tile (from `staging_<pid>`)
  * Render **legal placement targets** as clickable “ghost cells”
  * On click: call `moves.placeTile({ targetCoord, extraResourceIds: [] })`
  * If no placements exist: expose `moves.passTilePlacement({})`
* If stage == `politicalAction`:

  * Allow selecting a board tile (click) as “current target”
  * Provide **PlaceInfluence** that uses the selected tileId
  * Hard rule in UI: **Start Committee is not a valid target** for PlaceInfluence (disable + tooltip)
  * Keep `Pass` to end the turn

Scope note:

* Formalize / Convert / MoveInfluence UI can be stubbed as “disabled (MVP)” **as long as** PlaceInfluence + Pass lets a full game run.

#### C) Minimal regression test (client)

Add a small `vitest` test in `packages/client-web`:

* Given a mocked `G` containing `tile_start_committee` on board:

  * UI must not call `moves.placeInfluence` with `tile_start_committee`
  * Or: Start Committee is rendered as “not selectable” for influence placement

#### D) Bookkeeping

* Add `docs/tasks/0025_client-web-core-playability.md` (this contract + checklist)
* Update:

  * `docs/PR_TASK_LIST.md` add Task 0025 unchecked → checked when done
  * `CHANGELOG.md` under Unreleased: “Client: core hotseat MVP controls + board grid”

---

### Constraints

* No rules changes (CORE/EXP text untouched).
* Do not bypass move validation with direct state mutation.
* Deterministic rendering: no random ordering of grid cells / options.
* Default config remains CORE-only (expansion flags false).

---

### Invariants

* Engine remains the single source of truth; UI only calls moves.
* Start Committee restrictions remain enforced (and UI does not fight them).

---

### Acceptance Criteria

1. `pnpm -w dev` → can play multiple turns without UI dead-ends.
2. In `drawAndPlace`, the staged tile can be placed via UI onto a legal coord.
3. In `politicalAction`, PlaceInfluence works on a selected non-StartCommittee tile.
4. End of game triggers correctly when DrawPile is empty (no softlock).
5. `pnpm -w test` stays green (client + game).

---

### PR Checklist

* [ ] Implement `BoardGrid` from `G.grid` with deterministic ordering
* [ ] Implement stage-aware `Controls` (drawAndPlace vs politicalAction)
* [ ] Remove hardcoded `tile_start_committee` targeting
* [ ] Add minimal client regression test
* [ ] Update `docs/tasks/0025_...md`
* [ ] Update `docs/PR_TASK_LIST.md`
* [ ] Update `CHANGELOG.md` (Unreleased)
* [ ] CI green

---
