# Task 0256 — Fix computeMajority test filename typo

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `work`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (filename/reference cleanup only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT

---

## 2) Goal

* Rename the misspelled computeMajority test filename to `computeMajority.test.ts`.
* Update root `audit:spec` to use the corrected filename.
* Replace remaining repository references to the misspelled token.
* Document the work in task file + changelog with executed commands.

---

## 3) Non-Goals

* No gameplay/rule behavior changes.
* No logic changes in tests.
* No architecture contract changes.

---

## 4) Inputs

* Repo areas:
  * `packages/game/test/`
  * `package.json`
  * `docs/architecture/CORE-01-OBLIGATIONS.json`
  * `docs/tasks/archived/`
* Existing behavior summary:
  * One computeMajority test filename token was misspelled and referenced by scripts/docs.

---

## 5) Outputs

### 5.1 Code

* `packages/game/test/computeMajority.test.ts`
* `package.json`

### 5.2 Tests

* N/A (name/reference correction only)

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created

---

## 6) Constraints (Hard)

* Determinism unchanged.
* Engine authority unchanged.
* No phantom moves.
* No implicit rules.

---

## 7) Invariants (Must remain true)

* State/model behavior unchanged.
* Rules execution boundaries unchanged.

---

## 8) Implementation Plan

* [x] Rename the test file to the corrected spelling.
* [x] Update `audit:spec` script + repo-wide references.
* [x] Run requested verification commands.
* [x] Update task/changelog artifacts.

---

## 9) Acceptance Criteria

* [x] Correctly named test file exists and old filename is removed.
* [x] `audit:spec` references `computeMajority.test.ts`.
* [x] No remaining misspelled token in repository search.
* [x] Requested commands were executed and recorded.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails listed
* [x] Normative anchors cited
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (N/A, untouched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` passes (pre-existing failures in `packages/game`)
* [ ] Determinism verified (blocked by same pre-existing failures)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated
* [x] Frontend QA runbook followed or N/A (N/A; no UI scope)

---

## 11) Work Summary (3–7 bullets)

* Renamed the misspelled computeMajority test file to `packages/game/test/computeMajority.test.ts`.
* Updated root `audit:spec` script to call `computeMajority.test.ts`.
* Replaced misspelled token references across `docs/architecture` and archived task docs.
* Added task artifact `docs/tasks/0256-fix-compute-majority-test-filename.md`.
* Added changelog entry for task 0256.

---

## 12) Commands Run (with outcomes)

* `rg -n "<misspelled-token>"` → ✅ before-change discovery / after-change no matches.
* `pnpm -C packages/game test -- computeMajority.test.ts` → ❌ FAIL (command uses corrected filename; workspace runs full suite and fails on pre-existing tests `moves.test.ts` and `turn.test.ts`).
* `pnpm run audit:spec` → ❌ FAIL (uses corrected filename and progresses; fails on same pre-existing `packages/game` tests).
* `pnpm lint` → ✅ PASS.
* `pnpm test` → ❌ FAIL (same pre-existing two `packages/game` failures).

### 12.1 Frontend QA command order

* N/A (no frontend UI/process changes).

---

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

---

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (Postflight block).

---

## 15) Amendments (append-only)

### A-01 — N/A

* Reason: N/A
* Change: N/A
* Spec anchors: N/A
* Guardrails: N/A
