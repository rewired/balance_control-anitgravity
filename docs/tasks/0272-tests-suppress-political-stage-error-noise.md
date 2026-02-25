# Task 0272 — Stabilize political-stage rejection test output via console.error spy

**Date:** 2026-02-25
**Owner:** Codex
**Branch:** `work`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

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

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (test-harness output stability change only; no rule semantics changed)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM

## 2) Goal

* Keep the `political actions should reject when not in POLITICAL_ACTION_STAGE` test semantics unchanged.
* Silence noisy `console.error` output during this test via `vi.spyOn(console, 'error')`.
* Ensure spy restoration at the end of the test.

## 3) Non-Goals

* No changes to move legality logic.
* No changes to expected `INVALID_MOVE` outcomes.
* No client/UI/runtime behavior changes.

## 4) Inputs

* Repo areas:
  * `packages/game/test/moves.test.ts`
  * `docs/changelog.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (game test file scope only)

## 5) Outputs

### 5.1 Code

* `packages/game/test/moves.test.ts`

### 5.2 Tests

* `packages/game/test/moves.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (repo-local documentation policy)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Preserve the existing loop and assertions for `INVALID_MOVE` and no mutation.
* Restore `console.error` after test execution.
* Keep change localized to test harness behavior.

## 7) Invariants (Must remain true)

* Political actions outside `POLITICAL_ACTION_STAGE` remain illegal.
* The test still verifies state immutability under rejection.
* Test remains deterministic and side-effect clean due to spy restoration.

## 8) Implementation Plan

* [x] Step 1: Add `console.error` spy at test start with no-op implementation.
* [x] Step 2: Wrap existing loop assertions in `try/finally` and restore spy in `finally`.
* [x] Step 3: Add assertion that the error spy was called.
* [x] Step 4: Run focused Vitest command and lint.
* [x] Step 5: Update changelog and task artifact.

## 9) Acceptance Criteria

* [x] Test captures `console.error` with `vi.spyOn(console, 'error').mockImplementation(() => {})`.
* [x] Test still checks `INVALID_MOVE`, no state mutation, and `endTurn` not called for each move.
* [x] Spy is restored at end of test.
* [x] Focused test run passes.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm vitest run` (focused) passes
* [x] Determinism verified (golden replay/state hash) (scope note: test-only harness-output stabilization)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Added a `console.error` spy in the stage-gating political-actions rejection test.
* Wrapped the existing move loop in `try/finally` to guarantee `mockRestore()` execution.
* Kept all existing legality and no-mutation assertions unchanged.
* Added an assertion that at least one error log was emitted during invalid moves.
* Updated changelog and created this task artifact.

## 12) Commands Run (with outcomes)

* `pnpm --filter @balance-control/game exec vitest run test/moves.test.ts -t "political actions should reject when not in POLITICAL_ACTION_STAGE"` → OK
* `pnpm lint` → OK

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (non-UI scope)

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

* N/A
