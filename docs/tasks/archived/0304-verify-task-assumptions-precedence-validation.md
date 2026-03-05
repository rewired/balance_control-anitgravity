# Task 0304 — verify-task assumptions_precedence subsection validation

**Date:** 2026-02-26
**Owner:** Codex
**Branch:** `task/0304-verify-task-assumptions-precedence-validation`

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
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC=absent, DD=absent, TDD=present, AGENTS=present, VISION=absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.
* No conflicts in document assumptions for this task.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (tooling/docs task)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-05-DOCUMENTATION-CONTRACT.md

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Extend `scripts/verify-task.mjs` to validate the `### assumptions_precedence` subsection in section `0) Masterplan Guardrails`.
* Fail verification if any checkbox in that subsection is unchecked.
* Require a `no conflicts` note or a conflict-resolution reference to `docs/governance/document-precedence.md`.

---

## 3) Non-Goals

* No gameplay/runtime behavior changes.
* No expansion or state-model changes.
* No rule text or governance precedence ranking changes.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `scripts/verify-task.mjs`
  * `docs/tasks/_TASK_TEMPLATE_NONNEGOTIABLE.md`
* Existing behavior summary (current):

  * verify-task enforced precedence reference at section level but did not strictly parse `assumptions_precedence` checkboxes or conflict/no-conflict note.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (no UI/client-web scope).

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `scripts/verify-task.mjs`

### 5.2 Tests

* No dedicated test file added; validated via direct script execution on existing task docs.

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes; this is the only canonical changelog path)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

Changelog path policy (hard):

* Do not target `CHANGELOG.md` (root or any alternate path/case variant).
* Historical archived task files may reference legacy changelog paths; do not rewrite archive content solely for path wording.

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves: do not invent actions (e.g. pass) unless explicitly defined.
* No implicit rules: if spec does not state it, it does not exist.
* Expansion isolation: disabled expansions must not leak state, hooks, counters.
* Canonical services only:

  * `computeMajority(...)` is single source of truth.
  * `resolveEffect(...)` is the only mutation path for effects.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State is JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone.
* UI remains presentation-only; no rules logic in client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [x] Step 1: Add a dedicated parser check for `### assumptions_precedence` in section `0) Masterplan Guardrails`.
* [x] Step 2: Enforce unchecked-checkbox failure for that subsection.
* [x] Step 3: Enforce presence of either `no conflicts` statement or conflict-resolution note referencing `docs/governance/document-precedence.md`.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] `verify-task` fails when `### assumptions_precedence` subsection is missing.
* [x] `verify-task` fails when any checkbox in that subsection is unchecked.
* [x] `verify-task` fails if both `no conflicts` statement and document-precedence conflict note are absent.
* [x] Golden replay unchanged or updated intentionally with explanation. (N/A: tooling-only change)

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
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added `verifyAssumptionsPrecedenceSubsection` in `scripts/verify-task.mjs` and wired it into guardrails section validation.
* Enforced required anchors in that subsection (`### assumptions_precedence` and `I applied the document precedence rule`).
* Added strict failure when any checkbox in `assumptions_precedence` remains unchecked.
* Added required text check for either a brief `no conflicts` statement or a conflict-resolution note referencing `docs/governance/document-precedence.md`.
* Updated `docs/changelog.md` with task(0304) entry.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → ok
* `pnpm test` → ok
* `node scripts/verify-task.mjs 0301` → partial pass for new subsection checks; final fail expected because latest commit subject in this branch is not `task(0301): ...`

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → N/A (non-UI scope; covered above)
* `pnpm run test:ui:unit` → N/A (non-UI scope)
* `pnpm run test:ui:coverage` → N/A (non-UI scope)
* `pnpm run test:ui:e2e` → N/A (non-UI scope)

If not applicable, write explicit `N/A` with reason.

---

## 13) Postflight Proof (recorded in commit message)

Do NOT paste command outputs into this task file (it would dirty the tree after committing and cause an amend loop). Instead, capture postflight proof AFTER the final commit and append it to the latest commit message under a `Postflight:` section via ONE amend that edits the commit message only (no file changes).

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

Rule:

* After the postflight amend, do not modify any tracked files. The working tree must remain clean.

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

After creating exactly ONE commit, include `git show -1 --stat` output inside the same `Postflight:` block in the commit message (amend message only, no file changes).

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

Use only if something in Sections 0–9 must change after freezing the task.

* N/A
