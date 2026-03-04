# Task 0325 — Align board viewport unit tests with 4-argument setTransform runtime call

**Date:** 2026-03-04
**Owner:** Codex
**Branch:** `work`

---

**Task State:** FROZEN

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

* [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
* [x] I applied the missing-class rule: if a class had no applicable artifact, I skipped it and used the next available class in order.
* [x] I documented class presence/absence for this task (SEC/DD/TDD/AGENTS/VISION): SEC absent, DD present, TDD absent, AGENTS present, VISION absent.
* [x] If assumptions conflicted, I resolved them using `/docs/governance/document-precedence.md` and documented it.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (test-only alignment)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS

## 2) Goal

* Fix the pre-existing `packages/client-web` unit test failure in `board-viewport.test.tsx` caused by an outdated 3-argument `setTransform` expectation.
* Keep runtime behavior unchanged and only align test doubles/assertions with actual invocation shape.

## 3) Non-Goals

* No production component behavior changes.
* No rules, engine, or state-shape changes.

## 4) Inputs

* `packages/client-web/test/board-viewport.test.tsx`
* `packages/client-web/src/components/BoardViewport.tsx`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* `docs/testing/frontend-qa.md` applies.

## 5) Outputs

### 5.1 Code

* N/A (no production code changes)

### 5.2 Tests

* `packages/client-web/test/board-viewport.test.tsx`

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [x] `/docs/design-decisions/DD-0325-board-viewport-test-settransform-arg-alignment.md` created
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

## 6) Constraints (Hard)

* Determinism unchanged.
* Engine authority unchanged.
* No phantom moves.

## 7) Invariants (Must remain true)

* Board viewport fit/reset continue to store baseline data and call `setTransform` with runtime animation argument.
* UI tests remain isolated from rules logic.

## 8) Implementation Plan

* [x] Update viewport test mock function typing to accept optional `animationTime` as 4th arg.
* [x] Update failing assertions to validate the full runtime call signature including `200` animation duration.
* [x] Re-run `pnpm -C packages/client-web test` to verify regression closure.

## 9) Acceptance Criteria

* [x] `pnpm -C packages/client-web test` passes with no failure in `board-viewport.test.tsx`.
* [x] Change scope remains test+docs only.

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (no deterministic logic changed)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (never `CHANGELOG.md`)
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Updated `board-viewport.test.tsx` `mockSetTransform` type to include the optional fourth `animationTime` argument.
* Updated two assertions to expect the fourth argument (`200`) used by non-E2E runtime viewport transitions.
* Kept all behavior changes inside tests; production `BoardViewport` implementation is unchanged.
* Added DD-0325 and changelog entry for traceability.

## 12) Commands Run (with outcomes)

* `pnpm -C packages/client-web test` → pass (all tests green; board viewport regression resolved).
* `pnpm lint` → pass.

### 12.1 Frontend QA command order (required for UI/prozess scope)

* `pnpm -C packages/client-web test` → ok.
* Additional runbook commands: N/A for this assertion-alignment test fix (no UI behavior change).

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

`git show -1 --stat` captured in the same `Postflight:` block.

## 15) Amendments (append-only)

* N/A
