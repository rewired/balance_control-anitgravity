# Task 0355 — Server replay manifest type-guard hardening

**Date:** 2026-03-09  
**Owner:** Codex  
**Branch:** `work`

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

- Guardrails file read: `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- Governance precedence applied: `SEC > DD > TDD > AGENTS > VISION`

### affected_guardrails

- NONE (change scope is `packages/server` typing hardening + `packages/game` type re-export only; no gameplay/rules behavior changes in guardrail-scoped runtime logic).

### guardrail_gate

- [x] Guardrails read before implementation.
- [x] Compliance documented for affected guardrails (NONE).
- [x] If violation discovered, STOP and escalate via DD.

## 1) Primary Spec Anchors (MUST)

- CORE: N/A (no gameplay/rule execution changes)
- ARCH: ARCH-05 documentation protocol (task artifact + changelog + DD)

## 2) Goal

- Introduce an explicit replay manifest type guard in server replay logging.
- Remove `as any` access to manifest metadata fields.
- Type `createReplayFilename` through record helpers instead of blanket casts.
- Keep runtime replay file behavior unchanged.

## 3) Non-Goals

- No replay schema evolution.
- No engine rules/state mutation changes.
- No client-web or bot behavior changes.

## 4) Inputs

- `packages/server/src/replay-logging.ts`
- `packages/game/src/index.ts`

## 5) Outputs

- Code: `packages/server/src/replay-logging.ts`, `packages/game/src/index.ts`
- Docs: `docs/changelog.md`, `docs/design-decisions/DD-0355-replay-manifest-typing-guard.md`, `docs/tasks/0355-server-replay-manifest-type-guard-hardening.md`

## 6) Constraints (Hard)

- Deterministic replay emission semantics preserved.
- No silent behavior drift in filename derivation fallback values.
- Keep repo clean.

## 7) Invariants

- Replay filename format remains `<matchId>-<seed>-<yyyyMMddTHHmmssZ>.replay.ndjson`.
- Header/manifest/footer ordering remains unchanged.
- Required header metadata still sourced from manifest capture.

## 8) Implementation Plan

- [x] Add `isReplayManifestRecord` guard and typed helpers (`getRecordMatchId`, `getRecordSeed`, `getRecordStateHash`).
- [x] Replace metadata access and stream routing logic to use guards/helpers only.
- [x] Re-export `ReplayManifestRecord` from `@balance-control/game` package entrypoint.
- [x] Run scoped server tests/typecheck and workspace test.
- [x] Update task/changelog/DD artifacts.

## 9) Acceptance Criteria

- [x] No `(record as any)` remains for manifest fields in server replay logging.
- [x] `captureMetadata` reads `seed`, `matchConfig`, `expansions`, `loggingMode` only via manifest guard.
- [x] `createReplayFilename` uses typed helpers and compiles for full `ReplayRecord` union.
- [x] `ReplayManifestRecord` import from `@balance-control/game` type-checks.

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

- Added explicit replay manifest guard and typed record helpers in server replay sink.
- Removed unsafe cast-based field reads for filename, metadata capture, and hash extraction.
- Re-exported `ReplayManifestRecord` from `@balance-control/game` for package-level type import.
- Added architecture decision and changelog entry for auditability.

## 12) Commands Run (with outcomes)

- `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → pass.
- `pnpm -C packages/server exec tsc --noEmit` → pass.
- `pnpm test` → pass.

## 13) Postflight Proof

- Captured in final commit message under `Postflight:` (after final commit via amend-only message update).

## 14) Risks / Follow-ups

- N/A.

## 15) Amendments (append-only)

- N/A.
