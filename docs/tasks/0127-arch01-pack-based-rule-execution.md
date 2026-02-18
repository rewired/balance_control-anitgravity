# Task 0127 — ARCH: Allow pack-based rule execution (update ARCH-01 + guardrails + doc scope)

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0127-arch01-pack-based-rule-execution`

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

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: This task updates the guardrail wording to reflect the new architecture decision:

  * Rule execution remains **engine-owned** and must not move into the client.
  * Rule code may be **packaged** in `packages/expansion-*`, but may only be executed through the engine’s registration/assembly pipeline.
  * Client restrictions remain unchanged (presentation-only; legality/costs not computed in UI).

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: `ARCH-01:STATE_AUTHORITY`
* ARCH: `ARCH-01:RULE_EXECUTION`
* ARCH: `ARCH-01:CLIENT_RESTRICTIONS`
* ARCH: `ARCH-01:DETERMINISM`
* ARCH: `ARCH-05:SCOPE`

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Update the architecture contract so that **rule code may live in pack packages** (`packages/expansion-*`) without violating engine/client separation.
* Update masterplan guardrails so GR-002 no longer contradicts the new contract.
* Update documentation scope so TSDoc/rule-binding requirements also apply to pack packages that contain rule execution.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* Do not move any code yet (no pack extraction in this task).
* Do not change gameplay rules or state shape.
* Do not adjust build tooling or dependency graphs.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
  * `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
  * `docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md`

* Existing behavior summary (current):

  * ARCH-01 currently states “All rule execution occurs exclusively in packages/game”.
  * Masterplan GR-002 enforces the same wording.
  * ARCH-05 scope requires documentation primarily in `packages/game`.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

N/A

### 5.2 Tests

N/A

### 5.3 Docs

* [ ] Update `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` to allow pack-based rule code packaging.
* [ ] Update `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` GR-002 rule text to match.
* [ ] Update `docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md` scope to include pack packages that contain rule execution.
* [ ] `/docs/changelog.md` updated (required if logic/state/resolver changes) — **N/A (docs only)**
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)

  * If any contributor believes this contract change is ambiguous, STOP and create a DD doc.

---

## 6) Constraints (Hard)

* Documentation-only; no code changes.
* Keep the new contract precise:

  * Engine remains the only authority for legality/costs/modifiers.
  * Client remains presentation-only.
  * Determinism requirements do not weaken.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash (contract remains).
* State authority remains in `packages/game`.
* No UI rule logic.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Update `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`:

  * Rewrite **RULE EXECUTION**:

    * “Rule execution is engine-owned” (still true)
    * “Rule implementations may be packaged in engine-loadable pack packages (packages/expansion-*)”
    * “The engine is the only executor; packs are registered and assembled; client does not execute rules”

  * Clarify **BOOT CONTRACT**:

    * Core pack is mandatory.
    * Packs must be registered before `createBalanceControlGame()`.

* [ ] Update `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`:

  * Update GR-002 `rule` and `forbidden` fields to match the new architecture.
  * (Optional, if trivial) fix `source_of_truth[*].path` entries that point to non-existent `/docs/arch/*` to the correct `/docs/architecture/*` paths.

* [ ] Update `docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md`:

  * Expand “Required on” scope to include exported symbols in `packages/expansion-*` that implement/mutate authoritative rules.

* [ ] Ensure wording remains consistent with:

  * `ARCH-01:CLIENT_RESTRICTIONS`
  * `ARCH-03` measure CPU contract (no resolution order change)

Notes:

* If any reviewer disputes interpretation, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] ARCH-01 explicitly permits rule code to be packaged in `packages/expansion-*` while keeping engine authority.
* [ ] GR-002 no longer claims “only in packages/game”; it forbids rule logic in the client and forbids bypassing the engine.
* [ ] ARCH-05 scope includes pack packages where rule code exists.
* [ ] No code files were changed.

---

## 10) PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

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

* TBD

---

## 12) Commands Run (with outcomes)

* TBD

---

## 13) Postflight Proof (recorded in commit message)

* `git status -sb`
* `git diff --stat`
* `pnpm -r test` (or `pnpm test` if that is the repo standard)

---

## 14) Commit Proof (recorded in commit message)

* TBD

---

## 15) Amendments (append-only)

