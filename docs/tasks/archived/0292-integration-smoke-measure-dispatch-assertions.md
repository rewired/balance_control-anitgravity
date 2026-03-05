# Task 0292 — integration smoke measure dispatch assertions

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0292-smoke-measure-dispatch-assertions`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers**.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-009
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Assertions use deterministic setup context (`Shuffle` no-op, `Die` fixed) and stable descriptor projections.
* GR-009: Tests assert enabled expansion zones exist and disabled expansion zones are absent.
* GR-012: Pack enablement is sourced from `packs.enabledPacks`; deck assertions verify config-driven enablement.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-03-02A
* EXP-01: EXP-01-00
* EXP-02: EXP-02-00
* EXP-03: EXP-03-00
* ARCH: ARCH-01:DETERMINISM, ARCH-02:EXPANSION_ZONES

---

## 2) Goal

* Replace TODO placeholders in `smoke.test.ts` with concrete assertions.
* Validate `EnginePackRegistry.getMeasureDeckDescriptors(state)` for stable, expected descriptor structure.
* Add explicit negative assertions for disabled packs (no descriptors and no zones).
* Keep smoke assertions deterministic and seed-stable.

---

## 3) Non-Goals

* No engine runtime logic changes.
* No UI/client-web changes.
* No ruleset or measure content edits.

---

## 4) Inputs

* `packages/integration-tests/test/smoke.test.ts`
* `packages/game/src/expansion-registry.ts`
* `packages/integration-tests/test/cross-expansion-matrix.test.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

N/A — no UI/prozess scope.

---

## 5) Outputs

### 5.1 Code

* `packages/integration-tests/test/smoke.test.ts`

### 5.2 Tests

* Updated smoke integration tests for descriptor + disablement assertions.

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (not needed)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (not needed)

---

## 6) Constraints (Hard)

* Determinism only; no system-time/randomness variance.
* Expansion isolation checks for disabled packs.
* No runtime move/rule behavior modifications.

---

## 7) Invariants (Must remain true)

* Same setup inputs produce stable descriptor projections.
* Disabled packs do not leak zones or measure deck descriptors.
* Core setup zones remain present.

---

## 8) Implementation Plan

* [x] Add deterministic setup context helper and expansion zone constants.
* [x] Replace smoke TODO with explicit descriptor structure + stability assertions.
* [x] Add disabled-pack negative assertions for descriptors and zones.
* [x] Update task artifact and changelog.

---

## 9) Acceptance Criteria

* [x] No TODO comments remain in `smoke.test.ts`.
* [x] Measure descriptor assertions validate expected stable projection and non-empty output when packs enabled.
* [x] Disabled packs have no deck descriptors and no expansion zones in setup state.
* [x] Updated integration tests pass.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed and compliance documented
* [x] Normative anchors cited
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved
* [ ] `pnpm lint` passes (not run)
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated
* [x] Frontend QA runbook followed or N/A with reason

---

## 11) Work Summary (3–7 bullets)

* Reworked smoke test setup to use deterministic fixed random hooks.
* Replaced placeholder TODO commentary with concrete assertions for expansion zone presence.
* Added stable descriptor projection assertions for `getMeasureDeckDescriptors` across enabled packs.
* Added negative assertions proving disabled packs do not expose descriptors or zones.
* Kept assertions deterministic by validating repeated descriptor reads on same state.

---

## 12) Commands Run (with outcomes)

* `pnpm --filter @balance-control/integration-tests test -- test/smoke.test.ts` → pass (all integration test files in package passed).

### 12.1 Frontend QA command order

* N/A — no UI/prozess scope.

---

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

### 13.1 Recorded

Recorded in final commit message.

---

## 14) Completion Notes

* Single commit produced on dedicated task branch.
* No additional tracked changes after postflight amend.

---

## 15) Amendments (append-only)

* None.
