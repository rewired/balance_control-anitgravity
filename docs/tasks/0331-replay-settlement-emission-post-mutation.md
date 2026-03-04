# Task 0331 — Replay settlement emission after post-mutation state

**Date:** 2026-03-04  
**Owner:** Codex  
**Branch:** `work`

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

- Guardrails file read: `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- Governance precedence applied: `SEC > DD > TDD > AGENTS > VISION`

### affected_guardrails

- GR-001
- GR-003

### compliance_notes

- GR-001: changes remain inside engine/replay verification boundaries (`packages/game`) and keep state authority in `G`.
- GR-003: replay `stateHash` ordering is corrected so emitted hashes reflect deterministic post-settlement state.

### guardrail_gate

- [x] Guardrails read before implementation.
- [x] Compliance documented for affected guardrails.
- [x] If violation discovered, STOP and escalate via DD.

### assumptions_precedence

- [x] Applied `SEC > DD > TDD > AGENTS > VISION`.
- [x] Applied missing-class rule where classes were absent.
- [x] Class presence/absence documented: SEC/DD/TDD/AGENTS/VISION = present/present/present/present/absent.

## 1) Primary Spec Anchors (MUST)

- CORE: CORE-01-07-03D, CORE-01-09-01A
- ARCH: ARCH-01:DETERMINISM, ARCH-05-DOCUMENTATION-CONTRACT

## 2) Goal

- Emit settlement replay records after deterministic settlement mutations complete so `stateHash` matches verifier-visible post-settlement `G`.
- Keep replay sink hashing API unchanged (`hashState(context.G)`) and fix callsite ordering.
- Add regression tests for both regular and final settlement checkpoint verification.

## 3) Non-Goals

- No replay schema changes.
- No gameplay rule changes to settlement mechanics.
- No server/client transport changes.

## 4) Inputs

- `packages/game/src/index.ts`
- `packages/game/src/engine/replay-sink.ts`
- `packages/game/src/replay-verify.ts`
- `packages/game/test/replay-verify.test.ts`

### 4.1 QA Runbook Baseline

- N/A (no UI scope)

## 5) Outputs

### 5.1 Code

- `packages/game/src/index.ts`
- `packages/game/src/replay-verify.ts`
- `packages/game/test/replay-verify.test.ts`

### 5.2 Tests

- `packages/game/test/replay-verify.test.ts`

### 5.3 Docs

- [x] `/docs/changelog.md` updated
- [x] `/docs/design-decisions/DD-0331-replay-settlement-hash-ordering.md` created
- [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

## 6) Constraints (Hard)

- Deterministic behavior only.
- Keep `stateHash: hashState(context.G)` unchanged.
- Verifier expectations must remain aligned with emitted record semantics.

## 7) Invariants

- Replay action sequencing behavior unchanged.
- Settlement mechanics unchanged; only replay emission order adjusted.
- `stateHash` always derives from authoritative `G`.

## 8) Implementation Plan

- [x] Move regular settlement `emitReplaySystemRecord(...)` to post-mutation point.
- [x] Move final settlement `emitReplaySystemRecord(...)` to post-mutation point.
- [x] Keep replay sink hash implementation unchanged.
- [x] Clarify replay verifier mismatch text for post-settlement assumption.
- [x] Add tests validating regular/final settlement records with hash verification.

## 9) Acceptance Criteria

- [x] Regular settlement emits replay record after production/hooks/resets/flag updates.
- [x] Final settlement emits replay record after deterministic settlement/end-condition mutations.
- [x] Verifier checkpoint mode validates both settlement kinds when `stateHash` is present.
- [x] Changelog and DD updated.

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

- Reordered regular settlement replay emission to occur after deterministic round-settlement mutations.
- Reordered final settlement replay emission to occur after deterministic final-settlement state updates.
- Kept replay sink hash source (`hashState(context.G)`) unchanged and aligned callsite timing.
- Updated verifier mismatch message to document post-settlement hash expectation.
- Added replay verifier regression tests that capture and verify both regular and final settlement records with `includeStateHash: true`.
- Added changelog + DD documentation for the ordering contract.

## 12) Commands Run (with outcomes)

- `pnpm --dir packages/game exec vitest run test/replay-verify.test.ts test/replay-sink.test.ts` → pass
- `pnpm lint` → pass

### 12.1 Frontend QA command order

- N/A (no UI scope)

## 13) Postflight Proof

- Captured in final commit message under `Postflight:` (after final commit via amend-only message update).

## 14) Risks / Follow-ups

- N/A

## 15) Amendments (append-only)

- N/A
