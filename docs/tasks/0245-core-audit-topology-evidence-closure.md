# Task 0245 — CORE Audit: Topology Evidence Closure

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0245-core-audit-topology-evidence-closure`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-003
* GR-004
* GR-009

### compliance_notes (required if affected_guardrails != NONE)

* GR-003: topology tests must be deterministic and replay-stable.
* GR-004: legal-intent checks must remain engine-owned and pure.
* GR-009: topology position/adjacency checks must preserve zone consistency.

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

* `packages/game/src/engine/topology.ts` (only if needed for testability seams)

### 5.2 Tests

* `packages/game/test/engine-topology.test.ts`
* `packages/game/test/legal-intents.test.ts` (if adjacency legality assertions are added there)

### 5.3 Docs

* [x] `/docs/changelog.md` updated (required if logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

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

* [ ] Step 1: enumerate topology-linked CORE IDs with ambiguous evidence quality.
* [ ] Step 2: add named tests with direct assertions per ID cluster.
* [ ] Step 3: rerun `audit:core-obligations` and confirm no topology-linked SUSPECT items remain.

## 9) Acceptance Criteria

* [ ] CORE-01-00-07/08/T01/T07A/04-05 have direct executable assertions.
* [ ] `pnpm -w audit:core-obligations` reports no SUSPECT for topology cluster.
* [ ] Golden replay unchanged or intentionally updated with explanation.

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

## 11) Work Summary (3–7 bullets)

* N/A

## 12) Commands Run (with outcomes)

* N/A

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

* N/A
