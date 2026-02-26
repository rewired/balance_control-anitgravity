# Task 0244 — Core Endgame and Legality Proof Hardening

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0244-core-endgame-legality-proof-hardening`

---

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)
### affected_guardrails
* GR-003
* GR-008

### compliance_notes (required if affected_guardrails != NONE)
* GR-003: Endgame checks remain deterministic under fixed action sequences.
* GR-008: No implicit end conditions or unstated tie-break handling.

### guardrail_gate
* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

## 1) Primary Spec Anchors (MUST)
* CORE: CORE-01-09-01, CORE-01-09-01A, CORE-01-09-03, CORE-01-09-04, CORE-01-10-01
* ARCH: ARCH-01:DETERMINISM

## 2) Goal
* Strengthen executable proof of endgame trigger, immediate settlement, and winner selection.
* Ensure obligations are validated by assertions, not only fixture references.

## 3) Non-Goals
* No lobby/server scoring changes.
* No expansion endgame paths.

## 4) Inputs
* packages/game/test/new-core-settlement-endgame-obligations.test.ts
* packages/integration-tests/test/golden-replay.test.ts
* docs/architecture/CORE-01-OBLIGATIONS.json

## 5) Outputs
### 5.1 Code
* packages/game/src/game.ts (if a logic defect is found)
### 5.2 Tests
* packages/game/test/new-core-settlement-endgame-obligations.test.ts
* packages/integration-tests/test/golden-replay.test.ts
### 5.3 Docs
* [x] /docs/changelog.md updated (required if logic/state/resolver changes)
* [x] /docs/design-decisions/DD-0244-endgame-legality-proof-hardening.md created
* [ ] /docs/rules/ERRATA-XXXX.md created (only if rule clarification) — N/A

## 6) Constraints (Hard)
* No rule reinterpretation; use explicit spec anchors.
* Maintain current scoring model unless tests prove mismatch.

## 7) Invariants (Must remain true)
* Endgame can trigger at turn-end or immediate settlement events as specified.
* Winner tie-break behavior is deterministic.

## 8) Implementation Plan
* [x] Add explicit assertion-level tests for listed endgame IDs.
* [x] Add deterministic replay that exercises immediate settlement edge path.
* [x] Run core audits + targeted suites.

## 9) Acceptance Criteria
* [x] Listed endgame IDs have direct executable evidence.
* [x] `pnpm -C packages/game test -- new-core-settlement-endgame-obligations.test.ts` passes.
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
* Added explicit endgame evidence assertions in `new-core-settlement-endgame-obligations.test.ts` for draw-pile termination winner selection, shared-victory ties, and tile-specific override legality binding.
* Hardened the existing CORE-01-09-01A test to assert gameover transition across the draw-and-place to settlement edge path.
* Added integration replay coverage in `golden-replay.test.ts` that replays the immediate-settlement edge flow twice and verifies deterministic hash + gameover parity.
* Updated `docs/changelog.md` with task(0244) entry documenting evidence hardening scope.
* Added `docs/design-decisions/DD-0244-endgame-legality-proof-hardening.md` to capture rationale and decision trace for documentation-first auditability.

## 12) Commands Run (with outcomes)
* `pnpm -C packages/rules build` → OK
* `pnpm -C packages/game exec vitest run test/new-core-settlement-endgame-obligations.test.ts` → OK (14 passed)
* `pnpm -C packages/integration-tests exec vitest run test/golden-replay.test.ts` → OK (11 passed)
* `pnpm lint` → OK
* `pnpm test` → OK

## 13) Postflight Proof (recorded in commit message)
### 13.1 Recorded
* Pending (to be appended in commit message amend)

## 14) Commit Proof (recorded in commit message)
### 14.1 Recorded
* Pending (to be appended in commit message amend)

## 15) Amendments (append-only)
* N/A
