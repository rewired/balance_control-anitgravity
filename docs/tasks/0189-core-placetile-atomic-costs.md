# Task 0189 — CORE: placeTile must not pay costs before legality is fully validated (atomic failure)

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0189-core-placetile-atomic-costs`
**Skills:** S01 (Repo Scan), S03 (Spec Anchor Tracer), S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-007
* GR-002

### compliance_notes
* GR-007: Enforce resolution order by validating legality before cost payment; avoid partial mutations on failure.
* GR-002: Keep all legality/cost behavior engine-side.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* CORE-01-04-05 (Placement adjacency requirement)
* CORE-01-04-05A (Placement choice must be a legal unoccupied position)
* CORE-01-06-00-02 (Costs/prohibitions/modifiers are part of effect resolution)
* CORE-01-06-00-03 (If an Effect does not resolve, **no partial state changes** occur)
* ARCH-03:RESOLUTION_ORDER (Prohibition → Cost → Payment → Output modifiers → Mutation)

---

## 2) Goal

* Ensure `placeTile` cannot move Resources (extra costs) unless placement legality is already fully established.
* On any `INVALID_MOVE` exit from `placeTile`, state must remain unchanged.

---

## 3) Non-Goals

* No change to what constitutes a legal placement.
* No change to hotspot detection/resolution semantics.
* No changes to cost computation itself (only ordering / atomicity).

---

## 4) Inputs

* Draw-and-place move implementation:
  * `packages/game/src/moves/stages/drawAndPlace.ts`
* Cost payment helper:
  * `packages/game/src/engine/resolver/costs.ts` (`checkAndPayCosts`)

---

## 5) Outputs

### 5.1 Code

* Reorder `placeTile` checks to guarantee atomic failure:
  * `packages/game/src/moves/stages/drawAndPlace.ts`

### 5.2 Tests

* Add a regression test proving no partial mutation when `placeTile` is invalid after cost payment would have occurred.
  * Suggested: create a minimal state where `tileExtraCosts` applies, then attempt an invalid placement (occupied coord or non-adjacent) and assert the paid Resource did not move.
  * Suggested location: `packages/game/test/moves-placeTile-atomic.test.ts` (new) or extend `packages/game/test/moves.test.ts`.

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (engine atomicity bugfix).
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* Do not introduce any “rollback” mechanism; instead, prevent paying costs before all validations that can fail.
* Keep deterministic behavior; do not add RNG.
* Preserve current payload schema and move contract.

---

## 7) Invariants (Must remain true)

* `placeTile` should be idempotent with respect to staging (one staged tile, one placement).
* No partial changes on `INVALID_MOVE`.

---

## 8) Implementation Plan

* [ ] Step 1: In `placeTile`, move **all** validations that can fail (stage, staging tile exists, target unoccupied, adjacency/legal position) **before** `checkAndPayCosts(...)`.
* [ ] Step 2: Keep prohibition check before costs (it is pure), but after the basic structural validations.
* [ ] Step 3: Add the regression test that fails on current behavior and passes after reorder.
* [ ] Step 4: Run `pnpm test`.

---

## 9) Acceptance Criteria

* [ ] Attempting an invalid `placeTile` does not move any Resources (no cost payment).
* [ ] Attempting an invalid `placeTile` does not change staging/board/grid/adjacency.
* [ ] All tests pass.
* [ ] `/docs/changelog.md` references CORE-01-06-00-03 and ARCH-03:RESOLUTION_ORDER.

---

## 10) PR Checklist

* [ ] Guardrails listed accurately.
* [ ] Normative anchors cited.
* [ ] No implicit rules introduced.
* [ ] `pnpm test` passes.
* [ ] Working tree clean after postflight amend.
