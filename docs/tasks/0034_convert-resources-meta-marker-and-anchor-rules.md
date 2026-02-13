# Codex Task 0034 — ConvertResources Meta-Marker + Anchor Rules

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* ConvertResources rules: CORE-01-04-22A–22F
* Determinism: AGENTS 0.2

---

## Goal

Align ConvertResources legality, costs, output unit, and Meta-Marker behavior with CORE-01 v1.0.20.

---

## Inputs

* CORE-01-04-22A–22F (`000-core.md` L156–L178)
* `packages/game/src/moves.ts`
* `packages/game/src/engine/legal-intents.ts`
* `packages/game/src/engine/resolver.ts`
* `packages/game/src/mechanics.ts`
* `packages/rules/src/index.ts`

---

## Outputs

1. **Output unit default**
   * ConvertResources produces exactly 1 Resource by default (CORE-01-04-22A).
   * If Grassroots tile text specifies multiple outputs, use that metadata instead.
2. **Control requirement**
   * ConvertResources is legal only if the active player controls at least one Grassroots tile on Board (CORE-01-04-22B).
3. **Convert Anchor selection**
   * Active player must select exactly one Grassroots tile they currently control as the Convert Anchor (CORE-01-04-22D).
4. **Repeat penalty**
   * If the player’s Meta-Marker is on any Tile in Convert mode at resolution start, add +1 Resource cost of any resort (CORE-01-04-22C).
   * Integrate the penalty into the canonical cost system so legality enumeration sees it.
5. **Meta-Marker placement**
   * After a successful ConvertResources, place the Meta-Marker on the Convert Anchor and set mode to Convert (CORE-01-04-22E).
6. **Expiry tracking**
   * Convert-based Meta-Marker expires at beginning of the player’s next turn (CORE-01-04-22F) and integrates with round-start return (Task 0032).
7. **Legal intents**
   * `enumerateLegalIntents` must emit only legal ConvertResources intents respecting control requirement and extra cost slots.

---

## Constraints

* No client-side legality computation beyond enumerated intents.
* No partial effects when ConvertResources fails.

---

## Invariants

* ConvertResources never resolves if the active player controls zero Grassroots tiles.
* ConvertResources cost validation is identical across move validation and legality enumeration.

---

## Acceptance Criteria

1. ConvertResources intents only appear when control requirement is satisfied.
2. Repeat penalty applies when Meta-Marker is in Convert mode on any Tile.
3. Convert Anchor is always a controlled Grassroots tile.
4. Unit tests cover:
   * Control requirement gating
   * Repeat penalty cost inclusion
   * Meta-Marker placement on anchor

---

## PR Checklist

* [x] Enforce ConvertResources control requirement
* [x] Add Convert Anchor selection semantics
* [x] Implement repeat penalty via cost system
* [x] Place Meta-Marker on anchor and set mode
* [x] Update legal intents enumeration
* [x] Add ConvertResources legality tests
* [x] Update `docs/PR_TASK_LIST.md` (add Task 0034)
