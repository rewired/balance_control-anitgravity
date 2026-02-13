# Codex Task 0033 — PlaceOrMoveInfluence Meta-Marker + Start Committee Gates

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Move meta-marker rules: CORE-01-04-12A–12C
* Start Committee targeting restrictions: CORE-01-08-06E
* Connectivity clarification: CORE-01-08-06C–06D

---

## Goal

Implement Move Influence Meta-Marker placement and PingPong/Shift modes, and enforce Start Committee source/destination restrictions for PlaceOrMoveInfluence.

---

## Inputs

* CORE-01-04-12A–12C (`000-core.md` L132–L143)
* CORE-01-08-06C–06E (`000-core.md` L316–L326)
* `packages/game/src/moves.ts`
* `packages/game/src/engine/resolver.ts`
* `packages/game/src/engine/legal-intents.ts`
* `packages/game/src/mechanics.ts`

---

## Outputs

1. **MoveInfluence Meta-Marker placement**
   * After a successful Move, place the active player’s Meta-Marker on the source tile and remove it from any previous tile (CORE-01-04-12A).
2. **PingPong vs Shift mode**
   * If Meta-Marker is on the destination tile when the Move begins, set mode to PingPong for the remainder of the Round.
   * Otherwise set mode to Shift (CORE-01-04-12B).
3. **Expiry tracking**
   * Move-based Meta-Marker expires at the beginning of the player’s next turn (CORE-01-04-12C) and integrates with the round-start return flow (Task 0032).
4. **Start Committee gates**
   * PlaceInfluence and MoveInfluence cannot target the Start Committee (existing rule).
   * MoveInfluence must also reject Start Committee as a source tile (CORE-01-08-06E).
5. **Connectivity rule audit**
   * If any path or connectivity helper exists, treat Start Committee as a connector only, without allowing Influence to pass through (CORE-01-08-06C–06D).
6. **Legal intents**
   * `enumerateLegalIntents` must not emit intents that violate Start Committee source/destination rules.

---

## Constraints

* Apply Meta-Marker changes only after a successful resolution (no partial effects).
* All legality checks live in engine moves and legality enumeration (ARCH-01).

---

## Invariants

* A MoveInfluence action cannot create or leave Influence on the Start Committee.
* Meta-Marker placement never occurs if the Move fails.

---

## Acceptance Criteria

1. PingPong vs Shift mode is set deterministically at Move start.
2. Meta-Marker is placed on the Move source tile after success.
3. MoveInfluence fails if source or destination is Start Committee.
4. Legal intents never include Start Committee as a source or destination.
5. Tests cover:
   * PingPong classification
   * Shift classification
   * Start Committee source/destination rejection

---

## PR Checklist

* [ ] Implement MoveInfluence Meta-Marker placement + modes
* [ ] Enforce Start Committee source/destination restriction
* [ ] Update legal intents for new gating
* [ ] Add unit tests for PingPong/Shift and Start Committee gating
* [ ] Update `docs/PR_TASK_LIST.md` (add Task 0033)
