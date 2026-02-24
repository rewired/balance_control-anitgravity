# Task 0244 — Core Endgame and Legality Proof Hardening

**Date:** 2026-02-24
**Owner:** Codex
**Branch:** `task/0244-core-endgame-legality-proof-hardening`

---

**Task State:** DRAFT

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
* CORE: CORE-01-09-01, CORE-01-09-03, CORE-01-09-06, CORE-01-09-07, CORE-01-10-01
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
* [ ] /docs/changelog.md updated (required if logic/state/resolver changes)
* [ ] /docs/design-decisions/DD-XXXX-<topic>.md created (only if ambiguity/conflict)
* [ ] /docs/rules/ERRATA-XXXX.md created (only if rule clarification)

## 6) Constraints (Hard)
* No rule reinterpretation; use explicit spec anchors.
* Maintain current scoring model unless tests prove mismatch.

## 7) Invariants (Must remain true)
* Endgame can trigger at turn-end or immediate settlement events as specified.
* Winner tie-break behavior is deterministic.

## 8) Implementation Plan
* [ ] Add explicit assertion-level tests for listed endgame IDs.
* [ ] Add deterministic replay that exercises immediate settlement edge path.
* [ ] Run core audits + targeted suites.

## 9) Acceptance Criteria
* [ ] Listed endgame IDs have direct executable evidence.
* [ ] `pnpm -C packages/game test -- new-core-settlement-endgame-obligations.test.ts` passes.
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
