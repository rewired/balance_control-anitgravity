# Task 0279 — Client-web Hotseat E2E hooks branch tests

**Date:** 2026-02-26
**Owner:** Codex
**Branch:** `work`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* NONE

### compliance_notes (required if affected_guardrails != NONE)

* N/A

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)

* CORE: N/A (client unit-test scope)
* EXP-01: N/A
* EXP-02: N/A
* EXP-03: N/A
* ARCH: ARCH-01:CLIENT_RESTRICTIONS, ARCH-06-UI-INTERACTION-CONTRACT

## 2) Goal

* Expand hotseat smoke tests with focused branch coverage for E2E hook setup/cleanup behavior.
* Cover loading fallback render when client snapshots are null or incomplete.
* Optionally validate `getStateID` fallback precedence via parameterized snapshots.

## 3) Non-Goals

* No production code behavior changes.
* No gameplay, rules, resolver, or state-shape changes.
* No visual or styling changes.

## 4) Inputs

* `packages/client-web/test/hotseat-shell.smoke.test.tsx`
* `docs/changelog.md`

### 4.1 QA Runbook Baseline (mandatory for UI/prozess tasks)

* N/A (unit-test-only scope; no UI runtime changes).

## 5) Outputs

### 5.1 Code

* N/A

### 5.2 Tests

* `packages/client-web/test/hotseat-shell.smoke.test.tsx`

### 5.3 Docs

* [x] `/docs/changelog.md` updated
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (only if rule clarification)

## 6) Constraints (Hard)

* Determinism preserved; no runtime randomness.
* Client remains presentation/testing-only and does not execute rules.
* No temporary files committed.

## 7) Invariants (Must remain true)

* Engine remains sole authority for legality/cost/majority/resolution.
* Test globals are reset between tests to prevent cross-test leaks.
* Hotseat smoke baseline seat-switch path remains covered.

## 8) Implementation Plan

* [x] Add mutable client snapshot mock to drive branch states.
* [x] Add E2E hook initialization assertions (`__BC_HOTSEAT_E2E__`, `__BC_HOTSEAT_E2E_STATE__`).
* [x] Add unmount cleanup assertions for identical/replaced API reference and state snapshot key removal.
* [x] Add loading-path tests for null/incomplete client snapshot.
* [x] Add parameterized `getStateID` fallback tests for `_stateID`, `stateID`, `ctx._stateID`, `ctx.stateID`, and null case.
* [x] Add `afterEach` cleanup restoring window globals + mock state.

## 9) Acceptance Criteria

* [x] E2E globals are created when hooks flag is enabled.
* [x] Unmount removes identical E2E API reference and always clears E2E state snapshot key.
* [x] Loading branch is rendered when client state is null or missing `G`/`ctx`.
* [x] `getStateID` fallback order returns expected values for all mocked carriers.
* [x] No global leak across test cases.

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
* [x] Frontend QA runbook followed or marked N/A with explicit reason (`docs/testing/frontend-qa.md`)

## 11) Work Summary (3–7 bullets)

* Extended hotseat smoke tests with dedicated E2E hook setup + teardown branch assertions.
* Added cleanup behavior proof for both identical and externally replaced `window.__BC_HOTSEAT_E2E__` references.
* Added two loading-path tests using controlled null/incomplete client snapshot mocks.
* Added parameterized `getStateID` fallback tests across supported snapshot field locations.
* Hardened `afterEach` cleanup by restoring hook globals and default mock client snapshot.
* Updated changelog with task summary.

## 12) Commands Run (with outcomes)

* `cd packages/client-web && pnpm vitest run test/hotseat-shell.smoke.test.tsx` → ✅ PASS (11 tests)
* `pnpm lint` → ✅ PASS

### 12.1 Frontend QA command order (required for UI/prozess scope)

* N/A (unit-test-only scope; no runtime UX change).

## 13) Postflight Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block).

## 14) Commit Proof (recorded in commit message)

Recorded in final commit message (`Postflight:` block including `git show -1 --stat`).

## 15) Amendments (append-only)

* N/A
