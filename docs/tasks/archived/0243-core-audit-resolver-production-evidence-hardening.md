# Task 0243 — Core Resolver and Production Evidence Hardening

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0243-core-resolver-production-evidence-hardening`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)
### affected_guardrails
* GR-007
* GR-010
* GR-011

### compliance_notes (required if affected_guardrails != NONE)
* GR-007: Preserved canonical resolver/CPU ordering and added assertion-level evidence.
* GR-010: Start Committee immunity remains explicit via formalize test evidence.
* GR-011: Production order/distribution canon preserved and tie remainder-to-Noise validated.

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
* [x] /docs/changelog.md updated (required if logic/state/resolver changes)
* [ ] /docs/design-decisions/DD-XXXX-<topic>.md created (only if ambiguity/conflict)
* [ ] /docs/rules/ERRATA-XXXX.md created (only if rule clarification)

## 6) Constraints (Hard)
* Keep canonical order: printed → doubles → modifiers → floors → majority → distribution.
* No hidden side effects outside resolver.

## 7) Invariants (Must remain true)
* Start Committee immunity maintained.
* Remainder-to-Noise handling deterministic.

## 8) Implementation Plan
* [x] Add explicit resolver-order assertions tied to rule IDs.
* [x] Strengthen production tests for tie and noise remainder obligations.
* [x] Regenerate/validate golden replay fixtures if intentionally changed.

## 9) Acceptance Criteria
* [x] Listed IDs have executable, assertion-level evidence.
* [x] `pnpm -C packages/game test -- moves.test.ts new-core-production-majority-obligations.test.ts` passes.
* [x] `pnpm -C packages/integration-tests test -- golden-replay.test.ts` passes.

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
* Added `packages/game/test/new-core-production-majority-obligations.test.ts` with assertion-level evidence for tied production split and deterministic remainder-to-Noise handling (CORE-01-06-16).
* Added Start Committee formalize immunity evidence showing prohibitions and extra costs do not block Start Committee resolution (CORE-01-08-04, CORE-01-04-14, CORE-01-04-15).
* Refactored integration golden replay test with a shared `runFixture` helper for explicit replay execution.
* Added deterministic rerun assertion for `core_majority_tie_no_control` golden fixture to harden replay/hash stability proof.
* Updated `docs/changelog.md` with task(0243) entry.
* Corrected invalid anchor references in task docs (`0244`, `0241`) so spec-anchor tripwire and workspace `pnpm test` pass.

## 12) Commands Run (with outcomes)
* `pnpm -C packages/rules build` → OK
* `pnpm -C packages/game exec vitest run test/moves.test.ts test/new-core-production-majority-obligations.test.ts` → OK (26 passed)
* `pnpm -C packages/integration-tests exec vitest run test/golden-replay.test.ts` → OK (10 passed)
* `pnpm lint` → OK
* `pnpm test` → OK

## 13) Postflight Proof (recorded in commit message)
### 13.1 Recorded
* N/A

## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
* N/A

## 15) Amendments (append-only)
* N/A
