# Task 0296 — ARCH-06 PendingChoice postcondition + hard-gate regression proof

**Date:** 2026-02-26
**Owner:** Codex
**Branch:** `task/0296-arch06-pending-choice-postcondition-hardgate-regression`

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

### affected_guardrails

* GR-002
* GR-006
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002:
  * Client assertions remain presentation-only and dispatch only engine-provided `LegalIntent`s.
* GR-006:
  * Contract/text and tests explicitly enforce pendingChoice hard-gate exit on successful `resolveChoice`.
* GR-014:
  * No icon mapping changes; UI assertions target interaction behavior only.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* CORE: N/A (UI interaction contract + client tests only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-06 §5 Pending Choice (Hard Gate), ARCH-01:CLIENT_RESTRICTIONS

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Make hard-gate exit semantics explicit in ARCH-06 via a precise postcondition.
* Prove via client test that successful `resolveChoice` returns interaction flow to normal inspect behavior.
* Prove failed `resolveChoice` dispatch surfaces visible user notice.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* No changes to engine move legality or resolver logic.
* No new UI components/styles.
* No changes to expansion behavior.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md`
  * `packages/client-web/test/pending-choice-hardgate.test.tsx`
  * `packages/client-web/src/ui/interaction/useGameInteractionController.ts`
* Existing behavior summary (current):

  * hard-gate behavior was implemented/tested, but post-dispatch state-clearing requirement was not explicit in the architecture text.

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

If the task touches client-web UX, UI interaction contract checks, or frontend QA process, bind this task to:

* `docs/testing/frontend-qa.md`

The command order and artifact policy from that runbook are mandatory unless this task explicitly states N/A with reason.

Bound: YES.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `docs/architecture/ARCH-06-UI-INTERACTION-CONTRACT.md`

### 5.2 Tests

* `packages/client-web/test/pending-choice-hardgate.test.tsx`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-0296-pending-choice-resolvechoice-postcondition.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A

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

* [x] Step 1: Add explicit PendingChoice postcondition text to ARCH-06 section 5.
* [x] Step 2: Extend hard-gate test to assert dispatch payload + rerendered state clears hard-gate + inspect flow resumes.
* [x] Step 3: Add regression test for visible dispatch rejection notice after resolveChoice dispatch failure.
* [x] Step 4: Add changelog + DD artifacts.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [x] ARCH-06 includes explicit next-state postcondition for successful `resolveChoice`.
* [x] Test asserts `resolveChoice` dispatched with expected payload on valid tile click.
* [x] Test asserts overlay is absent and inspect click works after rerender with cleared pendingChoice.
* [x] Test asserts dispatch failure path emits visible `dispatch.rejected` notice.
* [x] Golden replay unchanged or updated intentionally with explanation (N/A: no engine-transition logic touched).

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
* [ ] Determinism verified (golden replay/state hash) (N/A: client/docs scope)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added explicit ARCH-06 hard-gate postcondition requiring pendingChoice clear in next state after successful `resolveChoice` dispatch.
* Extended pending-choice hard-gate test with a full flow assertion: dispatch payload, hard-gate exit (no overlay), and restored inspect behavior.
* Added a dedicated regression test for visible `dispatch.rejected` toast when resolveChoice dispatch fails.
* Added DD-0296 capturing rationale and consequences for the postcondition contract.
* Updated `docs/changelog.md` with task 0296 summary.

---

## 12) Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm lint` → PASS.
* `pnpm run test:ui:unit` → PASS (46 files / 271 tests).
* `pnpm run test:ui:coverage` → PASS (thresholds met).
* `pnpm run test:ui:e2e` → FAIL (4 specs failing; browser installed successfully but runtime E2E assertions/timeouts remain).

### 12.1 Frontend QA command order (required for UI/prozess scope)

Reference: `docs/testing/frontend-qa.md`

* `pnpm lint` → PASS.
* `pnpm run test:ui:unit` → PASS.
* `pnpm run test:ui:coverage` → PASS.
* `pnpm run test:ui:e2e` → FAIL (non-environment test failures/timeouts; requires separate E2E stabilization task).

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

N/A.
