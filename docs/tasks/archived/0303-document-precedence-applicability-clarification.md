# Task 0303 — Document precedence applicability clarification

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `task/0303-document-precedence-applicability-clarification`

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

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC=present, DD=absent, TDD=present, AGENTS=present, VISION=absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (governance docs only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05 documentation contract; governance precedence policy.

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Add an explicit missing-class applicability rule in governance precedence documentation.
* Add canonical locations/scope mapping for each precedence class acronym.
* Mirror that policy into the non-negotiable task template assumptions section.

---

## 3) Non-Goals

* No engine/client/server/runtime behavior changes.
* No expansion, legality, or resolver logic changes.
* No ADR required unless ambiguity is discovered.

---

## 4) Inputs

* Repo areas:
  * `docs/governance/document-precedence.md`
  * `docs/tasks/_TASK_TEMPLATE_NONNEGOTIABLE.md`
  * `docs/changelog.md`
* Existing behavior summary (current):
  * precedence doc lacked explicit “missing class” skip rule and class-path mapping.
  * task template assumptions section lacked mandatory class present/absent recording.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A — documentation-only governance change.

---

## 5) Outputs

### 5.1 Code

* N/A

### 5.2 Tests

* N/A

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism unaffected.
* No implicit policy interpretation beyond explicit precedence order.
* Keep class mapping deterministic and path-based.

---

## 7) Invariants (Must remain true)

* Governance precedence remains `SEC > DD > TDD > AGENTS > VISION`.
* Task template remains compatible with existing task workflow.
* Canonical changelog path remains `/docs/changelog.md`.

---

## 8) Implementation Plan

* [x] Add missing-class applicability rule to `document-precedence.md`.
* [x] Add canonical locations/scope mapping subsection for SEC/DD/TDD/AGENTS/VISION.
* [x] Update `_TASK_TEMPLATE_NONNEGOTIABLE.md` assumptions section with explicit presence/absence recording requirement.
* [x] Update changelog entry.

---

## 9) Acceptance Criteria

* [x] `docs/governance/document-precedence.md` explicitly states skipping missing classes.
* [x] `docs/governance/document-precedence.md` includes canonical path/scope mapping for all five classes.
* [x] `docs/tasks/_TASK_TEMPLATE_NONNEGOTIABLE.md` assumptions include missing-class and class presence/absence checklist line.
* [x] changelog entry added under Unreleased.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes (blocked by pre-existing failure in `packages/game` test suite)
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added an explicit missing-class applicability rule in governance precedence docs.
* Added canonical class acronym → path/scope mapping for SEC/DD/TDD/AGENTS/VISION.
* Mirrored the same policy in task template assumptions with explicit class presence/absence capture.
* Updated changelog with task(0303) documentation entry.

---

## 12) Commands Run (with outcomes)

* `pnpm lint` → ok
* `pnpm test` → fails due to pre-existing `packages/game` test failure in `test/new-core-settlement-endgame-obligations.test.ts` (`treats only explicit starting markers as gate blockers`)

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A — documentation-only governance change.

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

* None.
