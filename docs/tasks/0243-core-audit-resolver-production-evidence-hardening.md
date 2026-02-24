# Task 0243 — Core Resolver and Production Evidence Hardening

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0243-core-resolver-production-evidence-hardening`

---

**Task State:** DRAFT

## 0) Masterplan Guardrails (MUST)
### affected_guardrails
* GR-007
* GR-010
* GR-011

### compliance_notes (required if affected_guardrails != NONE)
* GR-007: Preserve canonical resolver order while improving evidence specificity.
* GR-010: Keep Start Committee immunity checks explicit.
* GR-011: Keep production order and distribution canon intact.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-04-13, CORE-01-04-14, CORE-01-04-15, CORE-01-06-16, CORE-01-07-03A, CORE-01-07-03D, CORE-01-08-04
* ARCH: ARCH-03:RESOLUTION_ORDER

## 2) Goal
* Ensure resolver and production obligations have direct executable assertions.
* Add/strengthen golden and invariant proofs for sequencing and immunity.

## 3) Non-Goals
* No expansion modifiers.
* No topology redesign.

## 4) Inputs
* packages/game/test/moves.test.ts
* packages/game/test/new-core-production-majority-obligations.test.ts
* packages/integration-tests/test/golden-replay.test.ts

## 5) Outputs
### 5.1 Code
* packages/game/src/engine/resolver.ts (if defect found)
### 5.2 Tests
* packages/game/test/moves.test.ts
* packages/game/test/new-core-production-majority-obligations.test.ts
* packages/integration-tests/test/golden-replay.test.ts
### 5.3 Docs
* [ ] /docs/changelog.md updated (required if logic/state/resolver changes)
* [ ] /docs/design-decisions/DD-XXXX-<topic>.md created (only if ambiguity/conflict)
* [ ] /docs/rules/ERRATA-XXXX.md created (only if rule clarification)

## 6) Constraints (Hard)
* Keep canonical order: printed → doubles → modifiers → floors → majority → distribution.
* No hidden side effects outside resolver.

## 7) Invariants (Must remain true)
* Start Committee immunity maintained.
* Remainder-to-Noise handling deterministic.

## 8) Implementation Plan
* [ ] Add explicit resolver-order assertions tied to rule IDs.
* [ ] Strengthen production tests for tie and noise remainder obligations.
* [ ] Regenerate/validate golden replay fixtures if intentionally changed.

## 9) Acceptance Criteria
* [ ] Listed IDs have executable, assertion-level evidence.
* [ ] `pnpm -C packages/game test -- moves.test.ts new-core-production-majority-obligations.test.ts` passes.
* [ ] `pnpm -C packages/integration-tests test -- golden-replay.test.ts` passes.

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
* N/A

## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
* N/A

## 15) Amendments (append-only)
* N/A
