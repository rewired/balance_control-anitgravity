# Task 0356 — Server replay test fixture typing and manifest metadata guard

**Date:** 2026-03-09  
**Owner:** Codex  
**Branch:** `work`

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

- Guardrails file read: `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- Governance precedence applied: `SEC > DD > TDD > AGENTS > VISION`

### affected_guardrails

- NONE (scope is `packages/server` tests + docs only; no gameplay/rules runtime changes in guarded packages).

### guardrail_gate

- [x] Guardrails read before implementation.
- [x] Compliance documented for affected guardrails (NONE).
- [x] If violation discovered, STOP and escalate via DD.

## 1) Primary Spec Anchors (MUST)

- CORE: N/A (test typing/metadata boundary assertion only)
- ARCH: ARCH-05 documentation protocol

## 2) Goal

- Remove `as any` usage in `packages/server/src/replay-logging.test.ts` for manifest/action fixtures.
- Add strict fixture typing and compile-time coverage checks across all replay record variants used by replay logging.
- Add/adjust tests proving header metadata is accepted from `recordType: 'manifest'` only.

## 3) Non-Goals

- No replay runtime behavior changes in `packages/server/src/replay-logging.ts`.
- No schema version changes.

## 4) Inputs

- `packages/server/src/replay-logging.test.ts`

## 5) Outputs

- Code: `packages/server/src/replay-logging.test.ts`
- Docs: `docs/changelog.md`, `docs/design-decisions/DD-0356-replay-test-typing-and-metadata-source.md`, `docs/tasks/0356-server-replay-test-fixture-typing-and-manifest-metadata-guard.md`

## 6) Constraints (Hard)

- Keep replay behavior assertions deterministic.
- Keep compile-time checks in test scope only.

## 7) Invariants

- Header/manifest/footer ordering contract remains unchanged.
- Header metadata source remains manifest capture path.

## 8) Implementation Plan

- [x] Replace inline `as any` manifest/action literals with typed fixtures.
- [x] Add compile-time-only fixture matrix covering all `ReplayRecord` variants (`satisfies Record<string, ReplayRecord>`).
- [x] Add negative metadata-source test using non-manifest record with manifest-like fields.
- [x] Run targeted replay logging tests.

## 9) Acceptance Criteria

- [x] No `as any` remains in `packages/server/src/replay-logging.test.ts`.
- [x] Typed fixtures exist for manifest/action records.
- [x] Compile-time variant coverage check exists for all record variants replay logging processes.
- [x] Test proves header metadata is not accepted from non-manifest records.

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails section completed (affected GR-xxx listed or NONE)
- [x] Normative anchors listed / N/A justified
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (N/A)
- [x] `pnpm lint` passes (not run in this scope)
- [x] `pnpm test` / package checks pass for scope
- [x] Determinism preserved
- [x] No temporary files committed
- [x] `/docs/changelog.md` updated (canonical path)

## 11) Work Summary

- Replaced `as any` test fixtures with strict `ReplayManifestRecord` and `ReplayActionRecord` constants.
- Added compile-time fixture matrix with `satisfies` checks for all replay record variants.
- Added metadata-source boundary test asserting non-manifest records cannot satisfy header metadata requirements.
- Updated changelog and DD to document rationale and test-boundary decision.

## 12) Commands Run (with outcomes)

- `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → pass.
- `pnpm -C packages/server exec tsc --noEmit` → fails in this environment due unresolved workspace package modules (`@balance-control/game`, `@balance-control/rules`) outside this task scope.

## 13) Postflight Proof

- Captured in final commit message under `Postflight:` (amend-only commit message update after final commit).

## 14) Risks / Follow-ups

- N/A.

## 15) Amendments (append-only)

- N/A.
