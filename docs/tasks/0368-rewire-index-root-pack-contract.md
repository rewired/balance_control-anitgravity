# Task 0368 — Rewire Game Factory onto Root-Pack Contract

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

- GR-001
- GR-002
- GR-003
- GR-009
- GR-010
- GR-011
- GR-012

### compliance_notes

- GR-001 (Engine State Authority): No state shape change; `buildCorePlayerView`/`coreEndIf`/`coreRootTurn` are pure relocations of existing logic, still JSON-serializable, no functions persisted in state.
- GR-002 (Engine-only Rule Execution): Rule execution (turn structure, endIf, playerView) still lives entirely inside `packages/game`/its registered required pack — only *where* the code lives changed (module boundary), not *what* executes it or *when*.
- GR-003 (Determinism): Verified via golden replay (`packages/integration-tests/test/golden-replay.test.ts`, 11/11 tests, no fixture regeneration) and full 8-config cross-expansion matrix — identical move sequences produce identical results before/after.
- GR-009 (Zone Invariants): Unaffected — zone masking logic (`buildCorePlayerView`) moved verbatim, not altered.
- GR-010 (Start Committee Immunity): Unaffected — no Start Committee logic in the moved turn/endIf/playerView code.
- GR-011 (Production Canon): Unaffected — round-settlement production dispatch (`EffectResolver.resolve` via the production.resolve effect queue) moved verbatim into `coreRootTurn.onEnd`.
- GR-012 (Match Config is Canonical): Unaffected — no change to how expansion enablement is read; the new `requiredPack` resolution reads `manifest.required`, the same canonical flag already used elsewhere.

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

- [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
- [x] I applied the missing-class rule where classes are absent.
- [x] Class presence/absence documented: SEC absent, DD present (DD-0366), TDD absent, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

- CORE: CORE-01-04-01, CORE-01-04-03, CORE-01-03-03A, CORE-01-09-01, CORE-01-09-01A, CORE-01-09-02, CORE-01-09-03, CORE-01-09-04, CORE-01-07-01, CORE-01-07-02, CORE-01-07-03D, CORE-01-00-03, CORE-01-00-04 (all unchanged, relocated verbatim from `packages/game/src/index.ts` to `packages/game/src/packs/core/root-pack.ts`)
- ARCH: DD-0366 (root-pack contract this task implements)

## 2) Goal

- Rewrite `createBalanceControlGameWithHooks()` (`packages/game/src/index.ts`) to source turn structure, `endIf`, and `playerView` from the registered required pack's `turn`/`endIf`/`playerView` fields instead of hardcoding CORE-01 specifics inline.
- Move the CORE-specific bodies (`buildPlayerView`, `computeCoreGameover`, `shouldAutoFinalSettlement`, the full `turn` block) into a new `packages/game/src/packs/core/root-pack.ts`, wired onto `CorePack`.
- Apply the DD-0366-scoped narrow fix: replace `pack.id !== 'core'` / `pack.id === 'core'` string-identity special-casing in `move-assembly.ts` with `!pack.manifest.required` / `pack.manifest.required`.

## 3) Non-Goals

- Does not split `engine/topology.ts` or `engine/legal-intents.ts` (Tasks 0369/0370).
- Does not physically relocate any file out of `packages/game` (Task 0373) — `root-pack.ts` is a new file staying inside `packages/game/src/packs/core/` for now.
- Does not touch the `'core'`-special-casing in `expansion-registry.ts`'s expansion-only iteration paths (explicitly deferred per DD-0366 Decision 3).

## 4) Inputs

- `packages/game/src/index.ts` (pre-change: hardcoded `CORE_POLITICAL_MOVE_IDS`/`DRAW_AND_PLACE_MOVE_IDS`/`ROOT_SYSTEM_MOVE_IDS`, `buildPlayerView`, `computeCoreGameover`, full `turn` block)
- `packages/game/src/packs/types.ts` (Task 0367's additive contract)
- `packages/game/src/packs/core/index.ts` (`CorePack`)
- `packages/game/src/move-assembly.ts` (`assemblePacks`, `buildStageMoveMap` — reused unchanged)
- `packages/game/test/pack-boundary-imports.test.ts` (static-analysis guardrail — surfaced that pack-internal files must funnel non-local imports through `../pack-api`)

## 5) Outputs

### 5.1 Code

- `packages/game/src/index.ts` — rewritten `createBalanceControlGameWithHooks()`; ruleset-agnostic
- `packages/game/src/packs/core/root-pack.ts` — new file: `coreRootTurn`, `coreEndIf`, `buildCorePlayerView`
- `packages/game/src/packs/core/index.ts` — `CorePack` now populates `turn`/`endIf`/`playerView`
- `packages/game/src/packs/pack-api.ts` — added re-exports (`drawTileToStaging`, `getRoundSettlementResortTileOrder`, `runFinalRoundSettlement`, `validateSurfaceHash`, `emitReplaySystemRecord`, `ReplayHookOptions` type) so `root-pack.ts` can reach kernel internals through the sanctioned indirection layer instead of deep relative imports
- `packages/game/src/move-assembly.ts` — `pack.id !== 'core'`/`pack.id === 'core'` → `!pack.manifest.required`/`pack.manifest.required`

### 5.2 Tests

- No new test files added — all 53 existing `packages/game` test files (265 tests) re-run as regression proof, including the static-analysis `pack-boundary-imports.test.ts` which caught an initial deep-import violation (fixed by routing through `pack-api.ts`).

### 5.3 Docs

- None this stage (deferred to Task 0375 closeout).

## 6) Constraints (Hard)

- Determinism: verified via golden replay + cross-expansion matrix, no time/Math.random/non-seeded sources touched.
- Engine authority: unaffected — rule execution stays in `packages/game`.
- No phantom moves: move ID lists (`rootMoveIds`, per-stage `moves`) are verbatim copies of the original constants.
- Canonical services only: `EffectResolver`/`computeMajority` untouched, called identically.

## 7) Invariants (Must remain true)

- Identical move sequence → identical state hash: verified (golden replay unchanged, no regeneration).
- State is JSON-serializable: unaffected.
- Every object exists in exactly one zone: unaffected (masking logic moved verbatim).
- UI remains presentation-only: not touched by this task.

## 8) Implementation Plan

- [x] Step 1: Add `mergeExpansionMoves` flag to `TurnStageDescriptor` and `replayHook` param to `onBegin`/`onEnd` signatures (small amendment to Task 0367's types, needed once the closure-based `replayHook` could no longer be captured by a static pack-level hook).
- [x] Step 2: Create `packages/game/src/packs/core/root-pack.ts` with `buildCorePlayerView`, `coreEndIf`, `coreRootTurn` — verbatim logic relocation.
- [x] Step 3: Wire `CorePack.turn`/`endIf`/`playerView` in `packages/game/src/packs/core/index.ts`.
- [x] Step 4: Rewrite `createBalanceControlGameWithHooks()` to resolve the required pack via `EnginePackRegistry`, throw if `turn`/`endIf`/`playerView` missing, build stages generically from `rootTurn.stages` (merging expansion moves only where `mergeExpansionMoves` is set).
- [x] Step 5: Apply the `move-assembly.ts` narrow fix (`!pack.manifest.required` replacing `pack.id !== 'core'`).
- [x] Step 6: Build `packages/game` — fix a `pack-boundary-imports.test.ts` violation by adding re-exports to `pack-api.ts` and importing through it from `root-pack.ts` instead of deep relative paths.
- [x] Step 7: Fix 3 `check-spec-anchors` violations caused by bare "CORE-01" tokens in prose comments (not `@rule` tags) — reworded to "CORE ruleset"/"CORE" without breaking the actual `@rule CORE-01-XX-XX` anchors alongside them.
- [x] Step 8: Full verification: `packages/game` test suite, `packages/integration-tests` suite (golden replay + cross-expansion matrix), full workspace build (`pnpm -r build`, including `client-web`), full `pnpm run audit:spec` gate.

## 9) Acceptance Criteria

- [x] `pnpm -C packages/game build` succeeds.
- [x] `pnpm -C packages/game test` — 53/53 files, 265/265 tests pass (including `pack-boundary-imports.test.ts`).
- [x] `pnpm -C packages/integration-tests test` — golden replay 11/11, cross-expansion matrix 8/8, smoke 4/4.
- [x] `pnpm -r build` — all 9 packages (incl. `client-web`) build successfully.
- [x] `pnpm run audit:spec` passes end-to-end.
- [x] Golden replay unchanged (no regeneration) — confirms zero behavior drift from the rewrite.
- [x] No other file in the repo referenced the removed local functions (`computeCoreGameover`, `buildPlayerView`, `shouldAutoFinalSettlement`, `isZoneVisible`, `makeDrawPilePlaceholders`) — verified via repo-wide grep, zero hits outside `root-pack.ts`.

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed and compliance demonstrated
- [x] Normative anchors cited for all changes
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (verified via cross-expansion matrix, 8/8 configs)
- [ ] `pnpm lint` — no dedicated lint script surfaced issues; `tsc` build across the workspace is the enforced type/lint gate here
- [x] `pnpm test` (`pnpm -C packages/game test`, `pnpm -C packages/integration-tests test`) passes
- [x] Determinism verified (golden replay unchanged, cross-expansion matrix green)
- [x] No temporary files committed
- [ ] `/docs/changelog.md` updated — deferred to Task 0375
- [x] Frontend QA runbook — N/A, no UI-visible behavior change (client-web build verified as a compile/regression check only)

## 11) Work Summary

- `createBalanceControlGameWithHooks()` no longer hardcodes CORE-01 turn structure, win condition, or player-view masking — it resolves all three from the single required pack's `turn`/`endIf`/`playerView` contract via `EnginePackRegistry`, throwing a clear error if the required pack doesn't supply them.
- Moved `buildPlayerView`→`buildCorePlayerView`, `computeCoreGameover`, `shouldAutoFinalSettlement`/`shouldEndByNoLegalPlacements`, and the full `turn.onBegin`/`onEnd` bodies into `packages/game/src/packs/core/root-pack.ts`, wired onto `CorePack`. Logic is a verbatim relocation — no behavior change.
- `onBegin`/`onEnd` gained a `replayHook` parameter (passed through from `createBalanceControlGameWithHooks`'s call site) since a static pack-level hook can no longer close over the per-invocation replay hook the way the old inline closure did.
- Reused `buildStageMoveMap` unchanged — it was already stage-agnostic; added a `mergeExpansionMoves` flag to `TurnStageDescriptor` so the generic stage-building loop in `index.ts` knows which stage(s) should receive expansion-contributed moves (only `politicalAction`, matching prior behavior).
- Discovered and fixed a real architectural boundary via the existing `pack-boundary-imports.test.ts` guardrail test: pack-internal files must route non-local imports through `pack-api.ts`, not deep relative paths — added the needed re-exports there.
- Applied the DD-0366-scoped narrow fix in `move-assembly.ts`: `pack.id !== 'core'`/`=== 'core'` string checks replaced with `!pack.manifest.required`/`pack.manifest.required`.
- Zero behavior drift confirmed: full test suite, golden replay (no regeneration), full cross-expansion matrix, full workspace build, full `audit:spec` gate all green.

## 12) Commands Run

- `pnpm -C packages/game build` → ok
- `pnpm -C packages/game test` → ok (53 files, 265 tests) — one transient failure in `pack-boundary-imports.test.ts` during implementation, fixed by routing `root-pack.ts` imports through `pack-api.ts`
- `pnpm -C packages/integration-tests test` → ok (3 files, 23 tests: golden-replay 11/11, cross-expansion-matrix 8/8, smoke 4/4)
- `pnpm -r build` → ok (all 9 packages incl. client-web)
- `pnpm run audit:spec` → ok end-to-end (gen/check spec-anchors — 3 transient anchor violations from bare "CORE-01" prose fixed — verify:packs, audit:core-obligations, spec-anchor-tripwire, computeMajority/moves/hotspot, golden-replay)

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

### A-01 — `replayHook` param added to `onBegin`/`onEnd`, `mergeExpansionMoves` flag added to `TurnStageDescriptor`

- Reason: discovered during implementation that a static pack-level `turn.onBegin`/`onEnd` cannot close over the per-invocation `replayHook` the way the old inline closure in `createBalanceControlGameWithHooks` could; and the generic stage-building loop needs to know which stage(s) receive expansion-contributed moves (previously only `politicalAction` did, implicitly).
- Change: `RootTurnDescriptor.onBegin`/`onEnd` signatures gained an optional `replayHook?: ReplayHookOptions` argument; `TurnStageDescriptor` gained an optional `mergeExpansionMoves?: boolean` flag.
- Spec anchors: none added/changed (infrastructure-only amendment).
- Guardrails: no new guardrail impact — both are additive contract refinements within the same `EnginePackDefinition` extension scope frozen by DD-0366.
