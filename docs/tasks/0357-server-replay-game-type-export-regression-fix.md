# Task 0357 — Server replay game type export regression fix

**Date:** 2026-03-09  
**Owner:** Codex  
**Branch:** `work`

**Task State:** DONE

## 0) Masterplan Guardrails (MUST)

- Guardrails file read: `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- Governance precedence applied: `SEC > DD > TDD > AGENTS > VISION`

### affected_guardrails

- NONE (change is a package type re-export surface fix in `packages/game/src/index.ts` for server compile compatibility; no engine rule/state behavior changes).

### guardrail_gate

- [x] Guardrails read before implementation.
- [x] Compliance documented for affected guardrails (NONE).
- [x] If violation discovered, STOP and escalate via DD.

## 1) Primary Spec Anchors (MUST)

- CORE: N/A
- ARCH: ARCH-05 documentation protocol

## 2) Goal

- Restore missing replay type exports from `@balance-control/game` so `packages/server` replay logging files compile again.

## 3) Non-Goals

- No replay runtime behavior changes.
- No schema/content changes for replay records.

## 4) Inputs

- `packages/game/src/index.ts`
- `packages/server/src/replay-logging.ts`
- `packages/server/src/replay-logging.test.ts`

## 5) Outputs

- Code: `packages/game/src/index.ts`
- Docs: `docs/changelog.md`, `docs/tasks/0357-server-replay-game-type-export-regression-fix.md`

## 6) Constraints (Hard)

- Keep API change strictly additive for type exports.
- Preserve deterministic behavior (no runtime logic touched).

## 7) Invariants

- Replay sink record shapes remain unchanged.
- Server replay metadata guard behavior remains unchanged.

## 8) Implementation Plan

- [x] Compare replay record types declared in `packages/game/src/engine/replay-sink.ts` against public exports in `packages/game/src/index.ts`.
- [x] Re-export missing replay record type aliases required by server (`checkpoint.*`, `system.*` variants).
- [x] Rebuild dependency chain and verify server test/typecheck scope.

## 9) Acceptance Criteria

- [x] `@balance-control/game` exports all replay record types used by `packages/server` replay logging/tests.
- [x] `packages/server` replay logging test passes without local type shims.
- [x] `packages/server` TypeScript compile succeeds in this workspace setup.

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails section completed (affected GR-xxx listed or NONE)
- [x] Normative anchors listed / N/A justified
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (N/A)
- [x] `pnpm lint` passes (N/A for scoped hotfix)
- [x] `pnpm test` / package checks pass for scope
- [x] Determinism preserved
- [x] No temporary files committed
- [x] `/docs/changelog.md` updated (canonical path)

## 11) Work Summary

- Re-exported missing Replay v2 record types from `packages/game/src/index.ts`.
- Kept replay implementation untouched; only public type surface was corrected.
- Verified server replay logging test and package typecheck after rebuilding workspace dependency order.

## 12) Commands Run (with outcomes)

- `pnpm -C packages/expansion-01 build && pnpm -C packages/expansion-02 build && pnpm -C packages/expansion-03 build && pnpm -C packages/packs build && pnpm -C packages/game build && pnpm -C packages/server exec tsc --noEmit` → pass.
- `pnpm -C packages/server exec vitest run src/replay-logging.test.ts` → pass.

## 13) Postflight Proof

- Captured in final commit message under `Postflight:` (amend-only commit message update after final commit).

## 14) Risks / Follow-ups

- N/A.

## 15) Amendments (append-only)

- N/A.
