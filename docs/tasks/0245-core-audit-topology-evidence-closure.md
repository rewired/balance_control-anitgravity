# Task 0245 — CORE Audit: Topology Evidence Closure

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0245-core-audit-topology-evidence-closure`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-004
* GR-009

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: Added deterministic topology assertions and reran obligation/test audits with stable outcomes.
* GR-004: Topology legality evidence remains driven by `enumerateLegalIntents` in engine tests only.
* GR-009: Added direct Board-position uniqueness assertion to confirm one tile per position and one position per Board tile.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: CORE-01-00-07, CORE-01-00-08, CORE-01-00-T01, CORE-01-00-T07A, CORE-01-04-05
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:DETERMINISM

## 2) Goal

* Add explicit executable evidence for topology obligations currently covered only by broad test suites.
* Ensure adjacency symmetry, position binding, and legal placement adjacency are directly asserted.
* Reduce dependence on incidental assertions from generic invariant files.

## 3) Non-Goals

* No expansion behavior changes.
* No UI presentation changes.

## 4) Inputs

* Repo areas:
  * `docs/architecture/CORE-01-OBLIGATIONS.json`
  * `packages/game/test/engine-topology.test.ts`
  * `packages/game/test/core-compliance-invariants.test.ts`
* Existing behavior summary (current): many topology IDs map to generic evidence files without one-test-per-obligation clarity.

## 5) Outputs

### 5.1 Code

* `packages/game/src/engine/topology.ts` (only if needed for testability seams) — N/A

### 5.2 Tests

* `packages/game/test/engine-topology.test.ts`
* `packages/game/test/legal-intents.test.ts` (if adjacency legality assertions are added there) — N/A

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [x] `/docs/design-decisions/DD-0245-topology-evidence-closure.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources.
* Engine authority: rules/legality/costs computed only in `packages/game`.
* No phantom moves.
* No implicit rules.
* Expansion isolation preserved.

## 7) Invariants (Must remain true)

* Identical move sequence → identical state hash.
* State remains JSON-serializable.
* Every object exists in exactly one zone.
* UI remains presentation-only.

## 8) Implementation Plan

* [x] Step 1: enumerate topology-linked CORE IDs with ambiguous evidence quality.
* [x] Step 2: add named tests with direct assertions per ID cluster.
* [x] Step 3: rerun `audit:core-obligations` and confirm no topology-linked SUSPECT items remain.

## 9) Acceptance Criteria

* [x] CORE-01-00-07/08/T01/T07A/04-05 have direct executable assertions.
* [x] `pnpm -w audit:core-obligations` reports no SUSPECT for topology cluster.
* [x] Golden replay unchanged or intentionally updated with explanation. (Unchanged; no replay fixture edits.)

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required

## 11) Work Summary (3–7 bullets)

* Added explicit topology tests for Board position binding uniqueness (CORE-01-00-07, CORE-01-00-T06).
* Added explicit legal-intent adjacency test for `placeTile` coordinates (CORE-01-04-05).
* Kept existing adjacency-consistency and `isMoveAdjacent` tests for CORE-01-00-08 / CORE-01-00-T01 / CORE-01-00-T07A and expanded direct evidence links.
* Updated CORE obligations registry evidence entries so CORE-01-00-07 and CORE-01-04-05 point to explicit topology evidence tests.
* Updated changelog and added a design-decision note documenting evidence-closure rationale.

## 12) Commands Run (with outcomes)

* `pnpm -w audit:core-obligations` → OK
* `pnpm -C packages/game exec vitest run test/engine-topology.test.ts` → OK
* `pnpm lint` → OK
* `pnpm test` → OK

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

* Pending (to be appended in final commit message amend)

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

* Pending (to be appended in final commit message amend)

## 15) Amendments (append-only)

* 2026-02-24: Completed implementation/verification and promoted task state to DONE.
