# Task 0233 — Core compliance invariants: consolidate fast deterministic suite aligned to guardrails

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0233-core-compliance-invariants-suite`

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
* GR-009
* GR-010
* GR-011

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Tests are deterministic; no time-based assertions; stable seeds where randomness is required.
* GR-009: Invariants explicitly validate zone uniqueness and zone ordering constraints.
* GR-010: Tests assert start committee immunity/targeting constraints remain enforced.
* GR-011: Tests assert production canon behavior (especially uncontrolled production edge cases).

### guardrail_gate

* [ ] I read the guardrails file before implementation.
* [ ] I can explain compliance for every affected GR-xxx.
* [ ] If any GR-xxx would be violated, I will STOP and write a DD (design decision) or split the task.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: SPEC-AUDIT:WHAT_IS_CHECKED (invariants stage)
* ARCH: ARCH-02:SERIALIZATION
* ARCH: ARCH-01:DETERMINISM
* CORE: CORE-01-00 (core invariants are spec-driven)

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

* Introduce a single fast ‘core compliance invariants’ test suite that covers the highest-risk CORE rules and guardrails in one place.
* Ensure invariants are easy to extend and are explicitly traceable via rule-id references in test names/comments.
* Wire the suite into `pnpm audit:spec` as the canonical invariants stage (supplementing or replacing the current ad-hoc list).

---

## 3) Non-Goals

* No changes to gameplay logic, move resolution, legality, or setup.
* No UI work.
* No expansion-specific invariants in this suite.

---

## 4) Inputs

* Repo areas:

  * `packages/game/test/** (existing invariants & helpers)`
  * `packages/game/src/** (state shape + selectors)`
  * `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
  * `docs/rules/000-core.md`
  * `package.json (audit scripts)`

---

## 5) Outputs

### 5.1 Code

N/A

### 5.2 Tests

* `packages/game/test/core-compliance-invariants.test.ts (new)`
* `package.json (ensure `audit:spec` runs the suite)`

### 5.3 Docs

* [ ] `docs/architecture/SPEC-AUDIT.md (list the invariants suite as a required stage)`

---

## 6) Constraints (Hard)

* Runtime: keep the suite fast (target: a few hundred ms, not seconds). Prefer small deterministic setups over long simulations.
* Determinism: use seeded RNG helpers only if already canonical; otherwise prefer fixed fixtures.
* Traceability: each invariant should cite at least one CORE rule ID (in test name or leading comment).
* No snapshot-style tests that are sensitive to irrelevant ordering unless the ordering is itself a rule.

---

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable; no functions; no derived caches.
* Every object exists in exactly one zone (no duplication, no dangling).

---

## 8) Implementation Plan

* [ ] Create `core-compliance-invariants.test.ts` and group tests by topic (setup/topology, zones, targeting, production, determinism).
* [ ] Reuse existing helpers under `packages/game/test/_helpers` instead of inventing new fixtures.
* [ ] Add a small deterministic ‘smoke replay’ (few moves) only if needed to validate end-to-end invariants; prefer unit-level invariants first.
* [ ] Update `audit:spec` to include the new invariants file (and optionally remove redundant ones if it reduces maintenance).
* [ ] Run `pnpm audit:spec` and ensure no golden hash drift.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

* [ ] New invariants suite runs and passes locally and in CI.
* [ ] Each invariant test references relevant CORE rule IDs for traceability.
* [ ] `pnpm audit:spec` includes this suite as a required invariants stage.
* [ ] No engine behavior changes; no golden replay hash updates.

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
* [ ] Determinism verified (golden replay/state hash) if applicable
* [ ] No temporary files committed
* [ ] `/docs/changelog.md` updated if required

---

## 11) Work Summary (3–7 bullets)

* TODO (fill during VERIFYING/COMMIT_READY)

---

## 12) Commands Run (with outcomes)

* TODO (fill during VERIFYING/COMMIT_READY)

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
