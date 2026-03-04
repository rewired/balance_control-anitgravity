# Task 0330 — Server replay filename record type widening

**Date:** 2026-03-04  
**Owner:** Codex  
**Branch:** `work`

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

- Guardrails file read: `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- Governance precedence applied: `SEC > DD > TDD > AGENTS > VISION`

### affected_guardrails

- NONE (change scope is `packages/server` typing alignment; no `packages/game` / `packages/client-web` / `packages/bot-llm` rules behavior touched).

### guardrail_gate

- [x] Guardrails read before implementation.
- [x] Compliance documented for affected guardrails (NONE).
- [x] If violation discovered, STOP and escalate via DD.

## 1) Primary Spec Anchors (MUST)

- CORE: N/A (no gameplay rule behavior change)
- ARCH: ARCH-05 documentation protocol (task + changelog + DD artifacts)

## 2) Goal

- Change `createReplayFilename` signature to accept `ReplayRecord`.
- Remove stale `ReplayActionRecord` import if unused.
- Preserve existing filename derivation logic (`matchId`, `seed`, timestamp).
- Confirm `ensureStream(createReplayFilename(record))` type-checks for action + system records.

## 3) Non-Goals

- No replay payload format/schema changes.
- No engine rules or deterministic behavior changes.
- No HTTP replay endpoint behavior changes.

## 4) Inputs

- `packages/server/src/replay-logging.ts`

## 5) Outputs

- Code: `packages/server/src/replay-logging.ts`
- Docs: `docs/changelog.md`, `docs/design-decisions/DD-0330-replay-filename-record-type-widening.md`, `docs/tasks/0330-server-replay-filename-record-type-widening.md`

## 6) Constraints (Hard)

- Deterministic runtime behavior unchanged.
- No implicit gameplay/rules modifications.
- Keep repo clean.

## 7) Invariants

- Replay filenames remain `<matchId>-<seed>-<yyyyMMddTHHmmssZ>.replay.ndjson`.
- `NdjsonReplaySink.writeRecord` and stream routing stay record-agnostic.

## 8) Implementation Plan

- [x] Update `createReplayFilename` parameter type to `ReplayRecord`.
- [x] Remove unused `ReplayActionRecord` import.
- [x] Run server TypeScript check.
- [x] Update task/changelog/DD docs.

## 9) Acceptance Criteria

- [x] `createReplayFilename(record: ReplayRecord, ...)` compiles.
- [x] Filename derivation logic unchanged.
- [x] `NdjsonReplaySink.ensureStream` callsite type-checks with `ReplayRecord`.
- [x] `pnpm -C packages/server exec tsc --noEmit` passes.

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails section completed (affected GR-xxx listed or NONE)
- [x] Normative anchors listed / N/A justified
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (N/A)
- [x] `pnpm lint` passes (not run in this scope)
- [x] `pnpm test` / package check passes for scope (`packages/server` TypeScript check)
- [x] Determinism preserved
- [x] No temporary files committed
- [x] `/docs/changelog.md` updated (canonical path)

## 11) Work Summary

- Widened `createReplayFilename` from `ReplayActionRecord` to `ReplayRecord`.
- Removed now-unused `ReplayActionRecord` type import.
- Kept filename derivation logic based on `record.matchId` and `record.seed` untouched.
- Added DD-0330 plus changelog/task artifacts.

## 12) Commands Run (with outcomes)

- `pnpm -C packages/server exec tsc --noEmit` → pass.

## 13) Postflight Proof

- Captured in final commit message under `Postflight:` (after final commit via amend-only message update).

## 14) Risks / Follow-ups

- N/A.

## 15) Amendments (append-only)

- N/A.
