# Task 0190 — CORE: PlaceInfluence is legal only if player has ≥1 Influence in PersonalSupply

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0190-core-placeinfluence-requires-supply`
**Skills:** S01 (Repo Scan), S03 (Spec Anchor Tracer), S05 (Boundary Check), S08 (PR Hygiene)

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-004
* GR-007
* GR-010

### compliance_notes
* GR-004: Legal intents must not include PlaceInfluence when supply has no Influence.
* GR-007: Do not pay costs if the action is illegal.
* GR-010: Preserve Start Committee targeting restrictions.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* CORE-01-04-11A (Place legality: active player must have ≥1 Influence in PersonalSupply; Start Committee restrictions apply)
* CORE-01-08-04 (No Influence may be placed on Start Committee)
* CORE-01-06-00-03 (No partial state changes on invalid resolution)
* ARCH-03:RESOLUTION_ORDER (validate legality before payment)

---

## 2) Goal

* Make `placeInfluence` reject attempts when the player has no Influence available in PersonalSupply.
* Ensure costs are never paid for an illegal PlaceInfluence.
* Ensure server-side legal intent enumeration does not offer PlaceInfluence in that situation.

---

## 3) Non-Goals

* No changes to Hotspot influence placement (CORE-01-06-07 already allows “cannot place if none”).
* No changes to MoveInfluence.

---

## 4) Inputs

* Move implementation:
  * `packages/game/src/moves/stages/politicalAction.ts` (`placeInfluence`)
* Legal intent enumeration:
  * `packages/game/src/engine/legal-intents.ts` (`enumeratePlaceInfluence`)
* Influence atom handler (context only):
  * `packages/game/src/engine/atoms/influence.ts`

---

## 5) Outputs

### 5.1 Code

* Add a supply-availability check before any cost payment in `placeInfluence`.
* Add a corresponding pre-check in `enumeratePlaceInfluence`.

Files:

* `packages/game/src/moves/stages/politicalAction.ts`
* `packages/game/src/engine/legal-intents.ts`

### 5.2 Tests

* Add regression tests:
  * Move-level: when PersonalSupply has no Influence, `placeInfluence` returns `INVALID_MOVE` and state is unchanged.
  * Enumeration-level: when PersonalSupply has no Influence, there are **zero** `placeInfluence` legal intents.

Suggested locations:

* `packages/game/test/moves.test.ts` (extend)
* `packages/game/test/legal-intents.test.ts` (extend)

### 5.3 Docs

* [x] `/docs/changelog.md` updated.
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* No partial state changes: the illegal action must not pay extra costs and must not consume a Political Action.
* Determinism preserved; no RNG.

---

## 7) Invariants (Must remain true)

* Start Committee remains an illegal target.
* Usage tracking increments only on successful action resolution.

---

## 8) Implementation Plan

* [x] Step 1: Implement `hasInfluenceInSupply(pid)` check (simple scan of `PersonalSupply:${pid}` for object.type === 'Influence').
* [x] Step 2: In `placeInfluence`, enforce the check **before** `checkAndPayCosts(...)`.
* [x] Step 3: In `enumeratePlaceInfluence`, short-circuit to empty list if supply has no Influence.
* [x] Step 4: Add tests (move + enumeration).
* [x] Step 5: Run `pnpm test`.

---

## 9) Acceptance Criteria

* [x] `placeInfluence` is rejected when supply has no Influence; no costs are paid; no usage increments.
* [x] `enumerateLegalIntents` does not offer `placeInfluence` when supply has no Influence.
* [x] All tests pass.

---

## 10) PR Checklist

* [x] Guardrails listed accurately.
* [x] Normative anchors cited.
* [x] `pnpm test` passes.
* [x] Working tree clean after postflight amend.
