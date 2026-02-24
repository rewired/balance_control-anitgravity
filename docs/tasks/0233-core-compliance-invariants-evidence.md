# Task 0233 — Core compliance invariants: add a fast deterministic suite and link it as evidence for normative CORE obligations

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0233-core-compliance-invariants-evidence`

---

**Task State:** DONE

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
* GR-006
* GR-009
* GR-010
* GR-011

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Tests must be deterministic (no time, no Math.random, fixed seeds if RNG is needed).
* GR-006: Invariants must assert Hard-Gate semantics when `pendingChoice` exists (only ResolveChoice legal) where applicable.
* GR-009: Encode canonical zone invariants as tests (single-zone membership, attachments, ordered zones).
* GR-010: Cover Start Committee immunity/targeting constraints as tests.
* GR-011: Cover production canon and bank/noise behavior as tests.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-00 (State Model)
* CORE: CORE-01-03 (Setup)
* CORE: CORE-01-04 (Turn Structure)
* CORE: CORE-01-05 (Control)
* CORE: CORE-01-07 (Round Structure / Settlement)
* ARCH: SPEC-AUDIT:WHAT_IS_CHECKED

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Add a **single fast invariants suite** for CORE compliance (focused, deterministic, stable).
* Ensure the suite is suitable to be run as part of `audit:spec` (integration happens in Task 0235).
* Link these tests as **evidence** for normative CORE obligations in `CORE-01-OBLIGATIONS.json`.

---

## 3) Non-Goals

* No refactor of the full test suite.
* No performance benchmarking.
* No expansion logic coverage.

---

## 4) Inputs

* Repo areas:

  * `docs/architecture/CORE-01-OBLIGATIONS.json`
  * `packages/game/test/_helpers/**`
  * Existing tests that already encode invariants (reuse where possible):

    * `resolver-invariants.test.ts`
    * `move-assembly-invariants.test.ts`
    * `production-uncontrolled.test.ts`
    * `determinism-policy.test.ts`

* Existing behavior summary (current):

  * Core compliance checks are spread across multiple tests; audit:spec runs a hand-picked subset.

---

## 5) Outputs

### 5.1 Code

N/A

### 5.2 Tests

* `packages/game/test/core-compliance-invariants.test.ts` (new)

### 5.3 Docs

* `docs/architecture/CORE-01-OBLIGATIONS.json` updated (add `test:` evidence entries for covered obligations)

---

## 6) Constraints (Hard)

* The new suite must be **fast** (target: a few hundred ms locally; do not add huge loops).
* Tests must be **deterministic** and not depend on ordering of JS object keys.
* Each invariant test must include at least one `@rule` reference (comment/TSDoc) to the relevant CORE-01 IDs.
* Prefer asserting **engine-observable invariants** (state shape, legality enumeration constraints, settlement outcomes) over UI behavior.

---

## 7) Invariants (Must remain true)

* No golden replay drift.
* `pnpm test` remains green.
* `pnpm audit:core-obligations` remains green.

---

## 8) Implementation Plan

* [x] Create `core-compliance-invariants.test.ts` and group tests by CORE sections:

  * State Model / Zones (single-zone membership; ordered-zone conventions; attachment invariants; bank unlimited)
  * Setup (StartPosition binding; required tiles present; deterministic shuffle contract via stable seed)
  * Turn Structure (no phantom intents; PendingChoice hard-gate if present)
  * Control / Majority (tie → no control; lobbyist virtual influence affects majority only)
  * Settlement / Production (uncontrolled produces zero; bank materialization; noise sink behavior)

* [x] Where existing helpers/tests already encode the invariant, reuse helper logic rather than re-implementing.
* [x] Update `CORE-01-OBLIGATIONS.json`:

  * Add `test:` evidence pointers for each normative obligation covered by the new suite.
  * Avoid duplicate evidence spam; prefer 1–2 strong tests per obligation cluster.

* [x] Run:

  * `pnpm -C packages/game test -- core-compliance-invariants.test.ts`
  * `pnpm audit:core-obligations`

---

## 9) Acceptance Criteria

* [x] New test file exists and passes locally.
* [x] The suite covers the highest-risk normative CORE clusters (zones, start committee, majority/ties, production canon).
* [x] `CORE-01-OBLIGATIONS.json` references the new test as evidence for covered obligations.
* [x] No runtime behavior changes; golden hashes unchanged.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] Tests are deterministic and fast
* [x] `pnpm lint` passes
* [x] `pnpm test` passes
* [x] No temporary files committed

---

## 11) Work Summary (3–7 bullets)

* Created `packages/game/test/core-compliance-invariants.test.ts` with 16 focused compliance tests.
* Validated core invariants: single-zone membership, ordered zones, influence attachment, and bank materialization.
* Verified setup invariants: StartPosition binding, canonical tile counts, and deterministic RNG.
* Asserted turn and majority logic: PendingChoice gate, tie control rules, and Lobbyist virtual influence.
* Covered production settlement: uncontrolled zero-output, remainder-to-noise, and PositionKey sweep order.
* Linked tests as evidence for 21 normative obligations in `CORE-01-OBLIGATIONS.json`.
* Ensured clean audit report with zero orphans using `pnpm audit:core-obligations`.

---

## 12) Commands Run (with outcomes)

* `pnpm install`: Success.
* `pnpm build`: Success.
* `pnpm -C packages/game test -- core-compliance-invariants.test.ts`: Passed (16 tests).
* `pnpm audit:core-obligations`: Passed (zero orphans).
* `pnpm test`: Passed (workspace-wide).

---

## 13) Postflight Proof (recorded in commit message)

Required commands:

* `git status -sb`
* `git diff --stat`
* `pnpm lint`
* `pnpm test`
* `pnpm audit:core-obligations`

---

## 14) Commit Proof (recorded in commit message)

Include `git show -1 --stat` in the final commit message `Postflight:` block.

---

## 15) Amendments (append-only)
