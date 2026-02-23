# Task 0230 — Docs: Fix verify-docs compliance for deterministic cost helper

**Date:** 2026-02-23
**Owner:** Codex
**Branch:** `task/0230-docs-deterministic-cost-infra-remarks`

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

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-05:FORMAT
* ARCH: ARCH-05:CONSISTENT_RULE_ID_REFERENCES

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Fix CI `pnpm run verify:docs` failure by making the exported helper `selectDeterministicCostResourceIds` comply with ARCH-05 “infrastructure” documentation requirements.

---

## 3) Non-Goals

* Do not change engine behavior, determinism, legality, costs, or payment rules.
* Do not regenerate spec anchors (no `/docs/rules/` changes).
* Do not refactor unrelated documentation across `packages/game/src`.

---

## 4) Inputs

* CI failure:

  * `pnpm run verify:docs` → `packages/game/src/engine/deterministic-cost.ts` exported function missing required `@rule` or infra `@remarks`.
* Repo areas:

  * `packages/game/src/engine/deterministic-cost.ts`
  * `scripts/verify-docs.mjs`
  * `/docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md`

---

## 5) Outputs

### 5.1 Code

* Update TSDoc for `selectDeterministicCostResourceIds` to include `@remarks infrastructure; no direct SPEC binding` (per ARCH-05).

### 5.2 Tests

N/A

### 5.3 Docs

* [ ] `CHANGELOG.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No implicit rules: if spec does not state it, it does not exist.

---

## 7) Invariants (Must remain true)

* No behavior change: function semantics remain identical.
* `pnpm run verify:docs` passes.

---

## 8) Implementation Plan

* Update the exported function’s TSDoc to include the required infrastructure `@remarks` phrase (or add a SPEC `@rule` tag if binding exists).
* Run docs verification and tests, and record outputs in postflight commit-message amend.

---

## 9) Acceptance Criteria

* [ ] `pnpm run verify:docs` passes.
* [ ] `pnpm test` passes.
* [ ] Task file PR checklist completed.
* [ ] Exactly one commit on the task branch with postflight proof in the commit message.

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
* [x] Determinism verified (where applicable)
* [x] No temporary files committed
* [x] `CHANGELOG.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* Updated `selectDeterministicCostResourceIds` TSDoc to mark it as infrastructure per ARCH-05 (no SPEC binding).
* Unblocked CI `pnpm run verify:docs` by satisfying exported-symbol documentation checks.
* No behavior changes; deterministic selection logic remains identical.

---

## 12) Commands Run (with outcomes)

* `pnpm run verify:docs` → ok
* `pnpm lint` → ok
* `pnpm test` → ok

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
