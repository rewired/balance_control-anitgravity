# Task 0192 — CORE: ConvertResources legal-intent enumeration must match ConvertRecipe variants (typed/untyped)

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0192-core-convertresources-legal-intents-parity`
**Skills:** S01 (Repo Scan), S03 (Spec Anchor Tracer), S04 (Determinism Check), S07 (Golden Tests), S08 (PR Hygiene)

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails
* GR-004
* GR-013

### compliance_notes
* GR-004: Enumerate only truly-legal ConvertResources intents and include all legal variants.
* GR-013: Bot legality depends on enumeration correctness; prevent illegal suggestions.

### guardrail_gate
* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.

---

## 1) Primary Spec Anchors (MUST)

* CORE-01-04-22J (Locked declaration; illegal declaration → invalid; no state change)
* CORE-01-04-22K (Untyped Grassroots: 3→1 any)
* CORE-01-04-22L (Typed Grassroots: Variant A 2→1 {T}; Variant B 3→1 any but not {T})
* CORE-01-04-22L.1 (Illegal Variant B output = T is invalid)
* CORE-01-04-22C (Repeat Penalty meta-marker adds +1 cost)

---

## 2) Goal

* Make `enumerateConvertResources` produce:
  * For untyped Grassroots: only 3-input variants, outputs ∈ {DOM, FOR, INF}.
  * For typed Grassroots with tag T:
    * Variant A: 2 inputs, output fixed to T.
    * Variant B: 3 inputs, output ∈ {DOM, FOR, INF} and output ≠ T.
* Ensure enumeration uses the same validation logic as the move implementation (single source of truth).

---

## 3) Non-Goals

* No changes to ConvertResources execution logic (move + atoms) besides refactoring shared validation.
* No change to meta-marker repeat-penalty computation (only ensure enumeration respects extra cost slots).

---

## 4) Inputs

* Current enumeration:
  * `packages/game/src/engine/legal-intents.ts` (`enumerateConvertResources`)
* Current move validation helper:
  * `packages/game/src/moves/shared.ts` (`getGrassrootsConversionSpec`)
* Convert move implementation:
  * `packages/game/src/moves/stages/politicalAction.ts` (`convertResources`)
* Existing tests:
  * `packages/game/test/legal-intents.test.ts`
  * `packages/game/test/convert-resources-real-setup.test.ts`

---

## 5) Outputs

### 5.1 Code

* Create a shared, engine-owned helper for conversion-variant validation (so both move and enumerator use the same logic).
  * Suggested new file: `packages/game/src/mechanics/conversion.ts`
  * Export: `getGrassrootsConversionSpec(tile, inputCount, outputResort?)` (or equivalent name)
* Update imports:
  * `packages/game/src/moves/shared.ts` uses the shared helper.
  * `packages/game/src/engine/legal-intents.ts` uses the shared helper.
* Update `enumerateConvertResources` to enumerate the correct variants as per spec anchors.

### 5.2 Tests

* Extend legal-intents tests to assert:
  * Typed Grassroots produces **both** a 2-input variant with output=T and a 3-input variant with output≠T.
  * Typed Grassroots does **not** enumerate Variant B outputs where output=T.
  * Untyped Grassroots enumerates only 3-input variants.

Suggested location:
* extend `packages/game/test/legal-intents.test.ts`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated.
* [ ] DD doc — N/A
* [ ] ERRATA — N/A

---

## 6) Constraints (Hard)

* Deterministic ordering: enumeration output must remain deterministically sorted.
* Avoid new engine↔moves circular dependencies; the shared helper must live outside `moves/`.
* Do not exceed `LEGAL_INTENT_BUDGET` (2000). If enumeration explodes, reduce by:
  * using deterministic “auto-selection” for extra-cost resources (already present for moveInfluence), or
  * limiting resource combo enumeration to canonical combinations (documented in code comment).

---

## 7) Invariants (Must remain true)

* Bot selects only from enumerateLegalIntents; therefore enumerated intents must be legal.
* ConvertResources remains illegal unless the player controls at least one Grassroots tile.

---

## 8) Implementation Plan

* [ ] Step 1: Introduce shared conversion-variant helper under `packages/game/src/mechanics/`.
* [ ] Step 2: Refactor `moves/shared.ts` to use the shared helper.
* [ ] Step 3: Update `enumerateConvertResources` to enumerate only spec-legal variants.
* [ ] Step 4: Add/extend tests for typed/untyped variant enumeration.
* [ ] Step 5: Run `pnpm test`.

---

## 9) Acceptance Criteria

* [ ] Typed and untyped Grassroots enumerate the correct legal variants only.
* [ ] No illegal ConvertResources intents are offered.
* [ ] Tests pass.

---

## 10) PR Checklist

* [ ] Guardrails listed accurately.
* [ ] Normative anchors cited.
* [ ] `pnpm test` passes.
* [ ] Working tree clean after postflight amend.
