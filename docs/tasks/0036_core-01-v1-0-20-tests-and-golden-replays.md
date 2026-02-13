# Codex Task 0036 — CORE-01 v1.0.20 Tests + Golden Replays

**Date:** 2026-02-13
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

* Unit tests: AGENTS 5.1
* Golden replays: AGENTS 5.2
* Deterministic hashing: AGENTS 5.3

---

## Goal

Update tests and golden replays to reflect CORE-01 v1.0.20 behavior while preserving traceability.

---

## Inputs

* Golden replay harness: `packages/game/test/golden-replay.test.ts`
* Hashing: `packages/game/src/hash-state.ts`
* Test fixtures: `packages/game/test/fixtures`
* Tasks 0032–0035 (Meta-Markers, Move/Convert rules, PingPong production)

---

## Outputs

1. **Unit/Integration tests**
   * Add or extend tests for:
     * Meta-Marker lifecycle
     * ConvertResources legality and penalties
     * MoveInfluence PingPong classification
     * PingPong production reduction
2. **Golden replay updates**
   * Re-run existing golden replays and update expected hashes.
   * Preserve traceability by:
     * Logging old hashes in fixture metadata or a dedicated note section per fixture.
     * Recording that the update is for CORE-01 v1.0.20 migration.
3. **Regression coverage**
   * Add at least one replay that exercises Meta-Marker + PingPong production interaction.

---

## Constraints

* No removal of fixtures without replacement.
* Golden replay updates must be deterministic and reproducible.

---

## Invariants

* Same replay produces identical hash across runs.
* Tests do not depend on system time or non-seeded randomness.

---

## Acceptance Criteria

1. `pnpm -w test` passes with updated fixtures.
2. Golden replay fixtures contain traceable notes for v1.0.20 changes.
3. At least one new replay covers Meta-Marker behavior.

---

## PR Checklist

* [x] Add/extend unit tests for CORE-01 v1.0.20 deltas
* [x] Update golden replay expected hashes with traceability
* [x] Add at least one new replay for Meta-Marker behavior
* [x] `pnpm -w test` green
* [x] Update `docs/PR_TASK_LIST.md` (add Task 0036)
