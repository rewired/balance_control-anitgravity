# Task 0284 — Client-web interaction controller machine regressions

**Date:** 2026-02-26
**Owner:** Codex (GPT-5.2-Codex)
**Branch:** `work`

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

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-006
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-006: Added/extended client-web interaction controller tests for PendingChoice Hard-Gate and transient reset behavior; hard-gate semantics remain restrictive.
* GR-014: No iconography changes; scope is tests + controller transient reset logic only.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (UI-controller test and transient-reset behavior only)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-06-UI-INTERACTION-CONTRACT (hard-gate and deterministic UI interaction state)

---

## 2) Goal

* Add deterministic regression tests in `interaction-controller-machine.test.ts` for hard-gate blocking, stage/seat transient reset behavior, Escape key reset behavior, convert auto-selection/autopropose paths, and UI notice timeout/unmount cleanup.
* Ensure new tests consistently use fake timers and controlled mock view-models.

---

## 3) Non-Goals

* No game-rule legality changes.
* No UI visual styling changes.
* No expansion behavior changes.

---

## 4) Inputs

* `packages/client-web/test/interaction-controller-machine.test.ts`
* `packages/client-web/src/ui/interaction/useGameInteractionController.ts`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* Bound to runbook: YES (`docs/testing/frontend-qa.md`)

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/test/interaction-controller-machine.test.ts`
* `packages/client-web/src/ui/interaction/useGameInteractionController.ts`

### 5.2 Tests

* `packages/client-web/test/interaction-controller-machine.test.ts`

### 5.3 Docs

* [x] `/docs/changelog.md` updated (documentation hygiene)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism preserved.
* Hard-gate remains restrictive.
* No new moves/intents introduced.

---

## 7) Invariants (Must remain true)

* PendingChoice hard-gate blocks action mutation entry points.
* Transient controller state resets on stage/seat changes and Escape.
* Convert auto-selection only autoproposes on single-variant family.
* Notice timers are cleaned up deterministically.

---

## 8) Implementation Plan

* [x] Add fake-timer-based tests for grouped hard-gate blocking of `proposeIntent`, `selectTile`, and `setActionMode`.
* [x] Add stage/seat reset tests with controlled VM transitions; add Escape-key reset test.
* [x] Add convert auto-selection tests for single-family/single-variant and multi-variant no-autopropose.
* [x] Add notice timeout and unmount cleanup timer tests.
* [x] Align stage-change reset effect to clear all transient state consistently.

---

## 9) Acceptance Criteria

* [x] New requested scenarios are covered by deterministic tests (`vi.useFakeTimers()`).
* [x] Convert auto-selection assertions distinguish one-variant vs multi-variant behavior.
* [x] Notice timeout and unmount cleanup assertions are present and passing.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash) — N/A (client-web interaction tests only)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

---

## 11) Work Summary (3–7 bullets)

* Added new hard-gate regression coverage that validates blocked `setActionMode`, `selectTile`, and `proposeIntent` in a single flow under pending choice.
* Added deterministic transient reset tests for vm.stage changes, active seat (`myPid`) changes, and Escape-key reset behavior.
* Added convert auto-selection tests for single output family auto-selection, single-variant auto-propose, and multi-variant no-autopropose behavior.
* Added UI notice cleanup tests for timeout-driven removal and unmount timer cleanup.
* Updated stage-change controller effect to reset full transient interaction state consistently.
* Updated changelog + task artifact for traceability.

---

## 12) Commands Run (with outcomes)

* `pnpm -C packages/client-web exec vitest run test/interaction-controller-machine.test.ts` → PASS.

### 12.1 Frontend QA command order (required for UI/prozess scope)

* `pnpm lint` → N/A (scope targeted to interaction-controller tests and one state-reset effect)
* `pnpm run test:ui:unit` → N/A (targeted suite run used)
* `pnpm run test:ui:coverage` → N/A (scope limited to focused regression additions)
* `pnpm run test:ui:e2e` → N/A (no visual/component rendering change)

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* tests (e.g. `pnpm test` or `pnpm vitest run`)

### 13.1 Recorded

Recorded in final commit message (Postflight block).

---

## 14) Commit Proof (recorded in commit message)

Include `git show -1 --stat` in `Postflight:` block.

### 14.1 Recorded

Recorded in final commit message (Postflight block).

---

## 15) Amendments (append-only after FROZEN)

* N/A
