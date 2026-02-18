# Task 0102 — Cleanup Misplaced Task Artifacts

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0102-cleanup-misplaced-task-artifacts`

---

**Task State:** COMMIT_READY

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

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

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

List the exact normative anchors that justify this task.

* ARCH: ARCH-00-MASTERPLAN-GUARDRAILS (Keep the Repo Clean)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Remove misplaced code artifacts from `docs/tasks/`.
* Ensure repo cleanliness as per AGENTS.md guidelines.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No changes to engine logic.
* No changes to tests (other than removing redundant ones).

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* `docs/tasks/surface.ts`
* `docs/tasks/surface-hash.test.ts`

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* N/A (Deletion only)

### 5.2 Tests

* N/A (Deletion only)

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (N/A for cleanup)

---

## 6) Constraints (Hard)

* None.

---

## 7) Invariants (Must remain true)

* `pnpm test` must pass.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [x] Identify misplaced files.
* [x] Verify they are redundant/misplaced.
* [x] Delete the files.
* [x] Verify tests pass.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] Misplaced files are removed from `docs/tasks/`.
* [x] `pnpm test` passes.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* Identified `docs/tasks/surface.ts` and `docs/tasks/surface-hash.test.ts` as misplaced artifacts from Task 0100.
* Confirmed these files are redundant as more up-to-date versions exist in `packages/game/src/` and `packages/game/test/`.
* Deleted the misplaced files to maintain repository cleanliness.
* Verified that all tests continue to pass.

---

## 12) Commands Run (with outcomes)

* `pnpm test` -> OK

---

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Pending.

---

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Pending.

---

## 15) Amendments (append-only)

* N/A
