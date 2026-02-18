# Task 0120 — Fix multi-expansion Measure dispatch via explicit expansion-scoped registry API

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0120-measure-dispatch-expansion-scoped-api`

---

**Task State:** COMMIT_READY

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small clarifications, stop and create a follow-up task.

## 0) Masterplan Guardrails (MUST)

- Follow `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (no boundary violations, deterministic engine, packs are data/modules, UI remains presentation-only).
- Follow `AGENTS.md` (single-commit discipline, proof requirements, no drift).

## 1) Primary Spec Anchors (MUST)

- `docs/architecture/ARCH-03-MEASURE-CPU.md`
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
- `docs/architecture/ARCH-02-STATE-SHAPE.md`
- `docs/tasks/0118-game-packs-import-expansions-engine-entrypoints.md (current pack wiring context)`

## 2) Goal

- Eliminate ambiguous Measure resolution when multiple expansions define the same `measureId` (e.g. `M01`).
- Introduce `EnginePackRegistry.getMeasureAtomsForExpansion(expansionId, measureId, payload)` with deterministic error reporting.
- Update the engine Measure-play flow to resolve `expansionId` via `lookupMeasureDeckForObjectId(measureObjectId)` and dispatch via the new API.

## 3) Non-Goals

- No JSONification of measures or tiles in this task.
- No pack extraction / workspace package moves.
- No UI changes.
- No rule balance or content changes.

## 4) Inputs

- Repo root `AGENTS.md` + architecture docs under `docs/architecture/*`.
- Current Measure flow: `packages/game/src/engine/atoms/measure.ts` (or equivalent).
- Deck routing helper: `packages/game/src/engine/measure-deck-provider.ts` (`lookupMeasureDeckForObjectId`).
- Registry: `packages/game/src/expansion-registry.ts` (EnginePackRegistry).
- Existing tests covering registry/module behavior under `packages/game/test/*`.

## 5) Outputs

- New registry method `getMeasureAtomsForExpansion(expansionId, measureId, payload)` plus internal indexing to avoid linear scan where reasonable.
- Engine measure dispatch updated to call the new method (no more global `measureId` lookups).
- Deterministic error paths (unknown expansion, unknown measure within expansion).
- Tests proving that two expansions can both define `M01` and dispatch resolves correctly by `expansionId`.

## 6) Constraints (Hard)

- No new cross-boundary imports (engine must not import expansion `/ui` entrypoints).
- Preserve determinism (canonical ordering; stable, sorted error lists).
- Avoid adding `G` to registry APIs unless strictly required (prefer `payload` + ids).
- Keep the public surface minimal: either replace or clearly deprecate the old `getMeasureAtoms` path without keeping a silent fallback.

## 7) Invariants (Must remain true)

- Engine remains authoritative; packs provide declarative content and module functions only.
- Measure deck routing remains based on declared providers; no 'first match wins' behavior.
- Multi-expansion setups must behave identically across platforms/runs (no nondeterministic Map iteration).

## 8) Implementation Plan

1. Locate the current callsite where a Measure play dispatches atoms (likely `handleMeasurePlay`).
2. Add `EnginePackRegistry.getMeasureAtomsForExpansion(expansionId, measureId, payload)` and implement lookup using `(expansionId, measureId)`.
3. Refactor the existing `getMeasureAtoms` implementation to either (a) delegate to the new method with explicit ids, or (b) be removed if unused; ensure no ambiguous global id lookup remains.
4. Update engine dispatch: compute `expansionId` via `lookupMeasureDeckForObjectId(measureObjectId)` and call the new registry method.
5. Add/adjust tests: register at least two NOTE: real packs or minimal dummy packs that both define `M01`; assert dispatch selects the correct atoms based on expansionId.
6. Run repo tests; record commands and proof per `AGENTS.md`.

## 9) Acceptance Criteria

- [x] In a multi-expansion registration order, a Measure defined in EXP-02 with `measureId = M01` dispatches EXP-02 atoms (not EXP-01).
- [x] A deterministic test fails on the pre-change behavior and passes after this change (documented via assertions).
- [x] Unknown `expansionId` and unknown `measureId` produce deterministic, user-readable errors.
- [x] All tests pass and no new TypeScript build errors are introduced.

## 10) PR Checklist (Repo Artifact)

- [x] Task State progressed correctly (DRAFT→FROZEN before edits; DONE only at end).
- [x] Single commit on the task branch.
- [x] `pnpm -r test` (or the repo-equivalent) executed; results recorded in Section 12.
- [x] No unrelated formatting churn.
- [x] Determinism preserved; no order-dependent Map/Object iteration without canonicalization.
- [x] Postflight proof captured (per AGENTS) and included in commit message.

## 11) Work Summary (3–7 bullets)

- Introduced `EnginePackRegistry.getMeasureAtomsForExpansion(G, expansionId, measureId, payload)` to allow explicit dispatch.
- Deprecated `getMeasureAtoms` to discourage ambiguous global lookup.
- Updated `handleMeasurePlay` in `packages/game/src/engine/atoms/measure.ts` to resolve `expansionId` via `lookupMeasureDeckForObjectId` and dispatch to the specific expansion.
- Verified that `getMeasureAtomsForExpansion` validates expansion enablement to prevent leaks from disabled packs.
- Added `packages/game/test/measure-dispatch-collision.test.ts` to prove correct dispatch when multiple packs define the same measure ID (`M01`).

## 12) Commands Run (with outcomes)

- `pnpm test test/measure-dispatch-collision.test.ts` -> PASS (Proves dispatch isolation and error handling)
- `pnpm test test/pack-disablement-isolation.test.ts` -> PASS (Proves disabled packs don't leak)
- `pnpm test` -> PASS (38 test files, 146 tests passed)

## 13) Postflight Proof (recorded in commit message)

- TBD

## 14) Commit Proof (recorded in commit message)

- TBD

## 15) Amendments (append-only)

- None
