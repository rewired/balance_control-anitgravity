# Task 0235 — Spec audit hardening: integrate core obligations audit and make `audit:spec` a truthful CORE v1.1.0 compliance answer

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0235-spec-audit-integrate-core-obligations`

---

**Task State:** DRAFT

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-012

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Audit command remains deterministic and side-effect free (except for committed generated artifacts).
* GR-012: Audit validates canonical match config/ruleset manifest assumptions before accepting results.

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: SPEC-AUDIT:WHAT_IS_CHECKED
* ARCH: ARCH-05:TOOLING_&_ENFORCEMENT
* CORE: `docs/rules/000-core.md` (CORE v1.1.0)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Make `pnpm audit:spec` answer the real question: **“Are we compliant with CORE v1.1.0?”**
* Integrate the obligations audit so we do not confuse “ID exists” with “rule obligation is evidenced”.
* Provide clear failure messages (registry drift vs missing evidence vs orphaned evidence).

---

## 3) Non-Goals

* No changes to actual game rules.
* No expansion obligations.

---

## 4) Inputs

* Repo areas:

  * `docs/architecture/SPEC-AUDIT.md`
  * `docs/architecture/CORE-01-OBLIGATIONS.json`
  * `scripts/audit-core-obligations.mjs`
  * root `package.json` scripts

* Existing behavior summary (current):

  * `audit:spec` checks anchors + some invariants + golden replays. It does not currently enforce that normative CORE obligations have explicit evidence.

---

## 5) Outputs

### 5.1 Code

* root `package.json` updated (`audit:spec` sequence)

### 5.2 Tests

N/A

### 5.3 Docs

* `docs/architecture/SPEC-AUDIT.md` updated (include obligations stage and how to interpret failures)

---

## 6) Constraints (Hard)

* `audit:spec` must remain deterministic and runnable in CI.
* Failures must be actionable:

  * “registry/spec mismatch”
  * “normative missing evidence”
  * “evidence orphan”

* Keep runtime reasonable: obligations audit should be a quick filesystem scan + JSON validation.

---

## 7) Invariants (Must remain true)

* Existing CI `pnpm test` / `pnpm audit:spec` stays green after this task’s changes (given tasks 0231–0234 have been applied).
* No golden replay drift.

---

## 8) Implementation Plan

* [ ] Update `docs/architecture/SPEC-AUDIT.md`:

  * Add a new explicit step: **Core obligations audit**.
  * Document the three failure categories above.

* [ ] Integrate obligations into root `audit:spec` script:

  * Run after `check:spec-anchors` and `verify:packs` (so the spec ID universe is trusted).
  * Run before invariants/goldens (fast fail on mapping errors).

* [ ] Ensure `audit:core-obligations` exits non-zero when:

  * spec ↔ registry mismatch
  * any `NORMATIVE_*` entry lacks evidence
  * any evidence reference points to a missing file/fixture

* [ ] Verify end-to-end:

  * `pnpm audit:spec`
  * `pnpm test`

---

## 9) Acceptance Criteria

* [ ] `pnpm audit:spec` includes core obligations stage and fails correctly on the defined error classes.
* [ ] Docs explain the new stage and how to fix failures.
* [ ] No behavior changes; all tests/goldens remain stable.

---

## 10) PR Checklist (Repo Artifact)

* [ ] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [ ] Normative anchors cited for all changes
* [ ] Determinism preserved
* [ ] `pnpm test` passes
* [ ] `pnpm audit:spec` passes

---

## 11) Work Summary (3–7 bullets)

* TODO (fill during VERIFYING/COMMIT_READY)

---

## 12) Commands Run (with outcomes)

* TODO (fill during VERIFYING/COMMIT_READY)

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* `pnpm test`
* `pnpm audit:spec`

---

## 14) Commit Proof (recorded in commit message)

Include `git show -1 --stat` in the final commit message `Postflight:` block.

---

## 15) Amendments (append-only)
