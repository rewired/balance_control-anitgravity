# Task 0367 — Additive Root-Pack Contract Types

**Date:** 2026-07-16
**Owner:** Claude (Sonnet 5)
**Branch:** `task/0366-core-extraction-root-pack-contract`

---

**Task State:** DONE

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
**Governance precedence:** `/docs/governance/document-precedence.md` (`SEC > DD > TDD > AGENTS > VISION`)

### affected_guardrails

- GR-002
- GR-004
- GR-012

### compliance_notes

- GR-002 (Engine-only Rule Execution): New `turn`/`endIf`/`playerView`/`enumerateIntents` fields are optional additions to `EnginePackDefinition`; rule execution stays engine/pack-owned, no client or bot code touched.
- GR-004 (Single Legal Action Interface): `enumerateIntents` is an additive extension point for a future generic dispatch loop (Task 0370); `enumerateLegalIntents` itself is unchanged in this task, so the single canonical entrypoint is untouched.
- GR-012 (Match Config is Canonical): No change to how expansion enablement is read; `EnginePackRegistry.validateEnabledPacks` gained one new invariant (at most one required pack may define root hooks) but reads the same `manifest.required` flag already canonical for enablement.

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

- [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
- [x] I applied the missing-class rule where classes are absent.
- [x] Class presence/absence documented: SEC absent, DD present (DD-0366), TDD absent, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

- CORE: N/A (infrastructure/contract types, no rule behavior)
- ARCH: ARCH-01:CLIENT_RESTRICTIONS (unaffected), DD-0366 (root-pack contract this task implements)

## 2) Goal

- Add the `TurnStageDescriptor`/`RootTurnDescriptor` types and the optional `turn`/`endIf`/`playerView`/`enumerateIntents` fields to `EnginePackDefinition` (`packages/game/src/packs/types.ts`), per DD-0366.
- Add the "at most one required pack may define root hooks" invariant to `EnginePackRegistry.validateEnabledPacks` (`packages/game/src/expansion-registry.ts`).

## 3) Non-Goals

- Does not wire `CorePack` to actually populate these fields (Task 0368).
- Does not change `createBalanceControlGameWithHooks()` behavior.
- Does not touch `engine/legal-intents.ts` internals (Task 0370).

## 4) Inputs

- `packages/game/src/packs/types.ts` (37 lines pre-change)
- `packages/game/src/expansion-registry.ts` (`validateEnabledPacks`)
- `docs/design-decisions/DD-0366-core-extraction-root-pack-contract.md`

## 5) Outputs

### 5.1 Code

- `packages/game/src/packs/types.ts`
- `packages/game/src/expansion-registry.ts`

### 5.2 Tests

- Existing `packages/game` suite (53 files / 265 tests) re-run as regression proof; no new test added (purely additive types, no new branch to cover — the new registry invariant is exercised indirectly by every existing test that registers `CorePack`, since none trip it).

### 5.3 Docs

- None this stage (deferred to Task 0375 closeout).

## 6) Constraints (Hard)

- Determinism: no time/Math.random/non-seeded sources — unaffected, no runtime logic changed.
- Engine authority: unaffected.
- Additive-only: no existing field removed/renamed, no existing pack (`Exp01/02/03Pack`) required to change.

## 7) Invariants (Must remain true)

- Identical move sequence → identical state hash: verified via golden replay (unchanged, no regeneration).
- Every registered pack still validates: existing packs (`exp01/02/03`) have no `turn`/`endIf`/`playerView`, so the new invariant is a no-op for them today.

## 8) Implementation Plan

- [x] Step 1: Add `TurnStageDescriptor`/`RootTurnDescriptor` types to `packs/types.ts`.
- [x] Step 2: Add optional `turn`/`endIf`/`playerView`/`enumerateIntents` fields to `EnginePackDefinition`.
- [x] Step 3: Add the single-required-root-hook-owner check to `validateEnabledPacks`.
- [x] Step 4: Build `packages/rules`, `packages/shared`, `packages/game` — verify clean compile.
- [x] Step 5: Run `packages/game` test suite (53/53 files, 265/265 tests).
- [x] Step 6: Run `packages/integration-tests` suite incl. golden-replay (11 tests) and cross-expansion-matrix (8 configs).
- [x] Step 7: Run root `pnpm run audit:spec` gate end-to-end.

## 9) Acceptance Criteria

- [x] `pnpm -C packages/game build` succeeds.
- [x] `pnpm -C packages/game test` — 53 files / 265 tests pass, zero regressions.
- [x] `pnpm -C packages/integration-tests test` — golden replay (11 tests) passes without regenerating the fixture; cross-expansion matrix (8/8 configs) passes.
- [x] `pnpm run audit:spec` passes end-to-end.
- [x] Golden replay unchanged (no regeneration needed) — confirms zero behavior drift from purely-additive types.

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed and compliance demonstrated
- [x] Normative anchors cited for all changes (N/A — infra/contract types)
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (verified via cross-expansion matrix)
- [ ] `pnpm lint` — not run standalone this stage (build + full test suite run instead; no lint script issues surfaced by `tsc`)
- [x] `pnpm test` (`pnpm -C packages/game test`) passes
- [x] Determinism verified (golden replay unchanged)
- [x] No temporary files committed
- [ ] `/docs/changelog.md` updated — deferred to Task 0375
- [x] Frontend QA runbook — N/A, no UI touched

## 11) Work Summary

- Added `TurnStageDescriptor`/`RootTurnDescriptor` types and optional `turn`/`endIf`/`playerView`/`enumerateIntents` fields to `EnginePackDefinition` per DD-0366 — purely additive, no existing pack affected.
- Added a registry-time invariant: at most one required pack may define `turn`/`endIf`/`playerView`, guarding against future ambiguity once a root-pack contract consumer exists (Task 0368).
- Verified zero behavior drift: full `packages/game` suite (265 tests), golden replay (11 tests, no regeneration), cross-expansion matrix (8/8 configs), and the full `pnpm run audit:spec` gate all pass unchanged.

## 12) Commands Run

- `pnpm -C packages/rules build` → ok
- `pnpm -C packages/shared build` → ok
- `pnpm -C packages/game build` → ok
- `pnpm -C packages/game test` → ok (53 files, 265 tests)
- `pnpm -C packages/integration-tests test` → ok (3 files, 23 tests; includes golden-replay 11/11 and cross-expansion-matrix 8/8)
- `pnpm run audit:spec` → ok end-to-end

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

None.
