# Task 0176 — PendingChoice regression tests: hard-gate invariants

**Date:** 2026-02-21
**Owner:** Codex
**Branch:** `task/0176-ui-pendingchoice-hardgate-regression-tests`

---

**Task State:** DRAFT

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

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Tests assert UI consumes `LegalIntent` objects; no ad-hoc legality.
* GR-006: Tests lock down that, during pendingChoice, normal drafts cannot be committed and inspect is disabled.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: `ARCH-03` §PENDING CHOICE
* ARCH: `ARCH-06` §5 PENDING CHOICE (HARD GATE)
* ARCH: `ARCH-06-UI-INTERACTION-CHECKLIST.md` → Section 6 (PendingChoice Hard-Gate)

---

## 2) Goal

* Add/extend tests so that PendingChoice Hard-Gate behavior cannot silently regress:
  * only resolveChoice is actionable
  * inspect clicks are disabled
  * selectTile is board-driven (targets only)
  * non-selectTile is modal-driven (misclick-safe confirm)

---

## 3) Non-Goals

* No additional UI features.
* No engine-side tests.

---

## 4) Inputs

* Tests:
  * `packages/client-web/test/pending-choice-modal.test.tsx`
  * `packages/client-web/test/no-auto-commit-board-surface.test.tsx`
  * `packages/client-web/test/no-direct-commit-shortcuts.test.ts`
  * `packages/client-web/test/selection-inspector.test.tsx`

Existing behavior summary (current):

* There are coverage points for pendingChoice rendering and for selectTile modal bypass, but no explicit assertion that inspect clicks are disabled in hard-gate, and no regression around misclick-safe confirm.

---

## 5) Outputs

### 5.1 Code

* N/A

### 5.2 Tests

* Extend `pending-choice-modal.test.tsx` to assert:
  * non-selectTile: option click does not dispatch until Confirm
  * selectTile: non-target tile click does not change inspector selection
* If necessary, add a small dedicated test file (only if existing ones become too crowded):
  * `packages/client-web/test/pending-choice-hardgate.test.tsx`

### 5.3 Docs

* [ ] `/docs/changelog.md` updated (N/A)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Tests must not rely on non-deterministic ordering; use deterministic payloads.
* Keep tests fast: prefer RTL unit/integration style already used in `packages/client-web/test/*`.

---

## 7) Invariants (Must remain true)

* No auto-commit: normal moves never commit without explicit confirm.
* PendingChoice: only resolveChoice commits.

---

## 8) Implementation Plan

* [ ] Update tests in `pending-choice-modal.test.tsx` according to the updated modal + board behavior.
* [ ] Add explicit assertions for inspector non-mutation during hard-gate.
* [ ] Run: `pnpm -C packages/client-web test`.

---

## 9) Acceptance Criteria

* [ ] Tests fail if:
  * a pendingChoice option dispatches without confirm (non-selectTile)
  * a non-target board click mutates inspection during hard-gate
  * selectTile does not dispatch resolveChoice on target click
* [ ] `pnpm -C packages/client-web test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] No implicit rules introduced
* [ ] No phantom moves introduced
* [ ] Expansion isolation preserved (if touched)
* [ ] `pnpm lint` passes
* [ ] `pnpm test` (or `pnpm vitest run`) passes
* [ ] Determinism verified (golden replay/state hash)
* [ ] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* <fill during implementation>

---

## 12) Commands Run (with outcomes)

* <fill during implementation>

---

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

---

## 15) Amendments (append-only)

