# Task 0332 — Replay verifier round-settlement checkpoint fixture

**Date:** 2026-03-04  
**Owner:** Codex  
**Branch:** `work`

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

- Guardrails file read: `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- Governance precedence applied: `SEC > DD > TDD > AGENTS > VISION`

### affected_guardrails

- GR-003

### compliance_notes

- GR-003: verifier tests continue using deterministic replay seed and deterministic hash computation.
- GR-003: added explicit mismatch control asserting hash divergence failure path.

### guardrail_gate

- [x] Guardrails read before implementation.
- [x] Compliance documented for affected guardrails.
- [x] If violation discovered, STOP and escalate via DD.

### assumptions_precedence

- [x] Applied `SEC > DD > TDD > AGENTS > VISION`.
- [x] Applied missing-class rule where classes were absent.
- [x] Class presence/absence documented: SEC/DD/TDD/AGENTS/VISION = present/present/present/present/absent.

## 1) Primary Spec Anchors (MUST)

- CORE: CORE-01-07-03D
- ARCH: ARCH-01:DETERMINISM

## 2) Goal

- Tighten replay verifier checkpoint assertions for `system.roundSettlement.stateHash`.
- Add an explicit negative mismatch control.
- Clarify the `settlementKind: final` test scope.

## 3) Non-Goals

- No runtime engine behavior changes.
- No replay schema changes.
- No server/client transport changes.

## 4) Inputs

- `packages/game/test/replay-verify.test.ts`

### 4.1 QA Runbook Baseline

- N/A (no UI scope)

## 5) Outputs

### 5.1 Code

- `packages/game/test/replay-verify.test.ts`

### 5.2 Tests

- `packages/game/test/replay-verify.test.ts`

### 5.3 Docs

- [x] `/docs/changelog.md` updated
- [x] `/docs/design-decisions/DD-0332-replay-verifier-round-settlement-fixture.md` created
- [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

## 6) Constraints (Hard)

- Determinism only; no randomness/time dependencies.
- Verifier semantics unchanged; tests must align with current checkpoint behavior.

## 7) Invariants

- Replay action sequence validation behavior unchanged.
- `system.roundSettlement` hash verification still compares against current engine state.

## 8) Implementation Plan

- [x] Add a helper hash for replay start state.
- [x] Add a negative checkpoint mismatch control for `system.roundSettlement`.
- [x] Rename `settlementKind: final` test to clarify verifier-scope semantics.
- [x] Update changelog and DD documentation.

## 9) Acceptance Criteria

- [x] Positive checkpoint test for regular settlement hash remains green.
- [x] Negative control fails with `system.roundSettlement hash mismatch`.
- [x] Final-kind test naming explicitly describes payload/checkpoint scope.

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails section completed (affected GR-xxx listed)
- [x] Normative anchors listed / N/A justified
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved
- [x] `pnpm lint` passes
- [x] `pnpm test` / `pnpm vitest run` passes
- [x] Determinism preserved
- [x] No temporary files committed
- [x] `/docs/changelog.md` updated (canonical path)
- [x] Frontend QA runbook followed or N/A with reason

## 11) Work Summary

- Added `hashAtReplayStart()` helper to derive a deterministic non-matching checkpoint hash candidate.
- Added a negative verifier test that expects `system.roundSettlement hash mismatch` when checkpoint hash does not match current replay state.
- Renamed the `settlementKind: final` checkpoint test to clarify it validates hashing semantics for the enum payload value.
- Kept fixture shape deterministic and unchanged for existing replay-verify coverage.
- Updated changelog and DD-0332 documentation.

## 12) Commands Run (with outcomes)

- `pnpm --dir packages/game exec vitest run test/replay-verify.test.ts` → pass
- `pnpm lint` → pass

### 12.1 Frontend QA command order

- N/A (no UI scope)

## 13) Postflight Proof

- Captured in final commit message under `Postflight:` (after final commit via amend-only message update).

## 14) Risks / Follow-ups

- A dedicated fixture that provably traverses full regular/final settlement replay paths can be added as follow-up verifier coverage.

## 15) Amendments (append-only)

- N/A
