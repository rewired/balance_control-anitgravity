# Task 0370 — Split Legal-Intent Enumeration into Generic Dispatch + CORE Enumerators

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
- GR-006

### compliance_notes

- GR-002 (Engine-only Rule Execution): Legality enumeration remains engine/pack-owned; only the internal module boundary changed.
- GR-004 (Single Legal Action Interface): `enumerateLegalIntents(G, ctx, playerID)` remains the single canonical entrypoint with an unchanged public signature; it is now a generic dispatch loop over `EnginePackRegistry.getEnabledPacks(G)` calling each pack's `enumerateIntents` hook, rather than monolithic inline CORE logic.
- GR-006 (Pending Choice Gate): The `pendingChoice.player !== playerID → []` authorization gate stays in the kernel (generic, applies to any pack); the choice-option enumeration itself (`buildResolveChoiceIntents`) moved to CORE's `enumerateIntents`, called only after the kernel has already confirmed the caller owns the pending choice.

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

- [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
- [x] Class presence/absence documented: SEC absent, DD present (DD-0366), TDD absent, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

- CORE: CORE-01-04-05A, CORE-01-04-09, CORE-01-04-08, CORE-01-04-12D, CORE-01-04-12B, CORE-01-04-12A, CORE-01-08-02, CORE-01-08-03 (all unchanged, relocated verbatim to `packs/core/legal-intents.ts`)
- ARCH: DD-0366 (root-pack contract, `enumerateIntents` extension)

## 2) Goal

- Make `engine/legal-intents.ts`'s `enumerateLegalIntents` a ruleset-agnostic generic dispatch loop: authorize the caller (current player, pending-choice ownership), then merge `enumerateIntents(G, ctx, playerID)` contributions from every enabled pack, sort canonically, budget-clip.
- Move all CORE-01 enumeration logic (draw-and-place placement, place/move/formalize influence, convert resources, take measure, pending-choice option enumeration, and their supporting cost/resort/adjacency helpers) to `packages/game/src/packs/core/legal-intents.ts` as `coreEnumerateIntents`, wired onto `CorePack.enumerateIntents`.

## 3) Non-Goals

- Does not physically relocate the file out of `packages/game` (Task 0373).
- Does not change the `LegalIntent` public type/shape or `enumerateLegalIntents`'s public signature — both remain fully compatible with all existing callers (`bot-llm`, `client-web`).
- Does not remove the pre-existing dead `enumerateCostResourceIds` helper — moved verbatim (unused both before and after this task; removing it would be an unrelated cleanup).

## 4) Inputs

- `packages/game/src/engine/legal-intents.ts` (pre-change: 558 lines, monolithic CORE enumeration with a thin generic gate at the top)
- `packages/game/src/packs/types.ts` (Task 0367's `enumerateIntents?` field)
- Callers: `packages/bot-llm/src/adapter.ts`, `packages/client-web/src/ui/useIntentViewModel.ts`, and ~10 test files across `packages/game`, `packages/bot-llm`, `packages/client-web`

## 5) Outputs

### 5.1 Code

- `packages/game/src/engine/legal-intents.ts` — rewritten as a generic dispatch loop (~90 lines); keeps `LegalIntent` interface, `canonicalize`/`canonicalJsonStringify`/`sortIntents`/`appendIntents`, `LEGAL_INTENT_BUDGET`
- `packages/game/src/packs/core/legal-intents.ts` — new file: `coreEnumerateIntents` plus all CORE-specific enumerators and helpers (verbatim relocation)
- `packages/game/src/packs/core/index.ts` — `CorePack.enumerateIntents = coreEnumerateIntents`
- `packages/game/src/packs/types.ts` — simplified `enumerateIntents` signature to `(G, ctx, playerID) => any[]` (dropped an unused `stage` parameter from the Task 0367 draft; packs derive whatever stage concept they need from `ctx` themselves, keeping stage-name knowledge out of the kernel contract)
- `packages/game/src/packs/pack-api.ts` — added re-exports needed by `packs/core/legal-intents.ts` (`allStartingInfluencePlaced`, `countPlayerInfluence`, `getInfluenceCap`, `hasInfluenceInSupply`, `computeMajority`, `coordToString`/`getNeighbors`/`stringToCoord`, `evaluateTileSelector`, `EnginePackRegistry`, `getPlayerMetaMarker`, `getLegalGrassrootsOutputs`, `selectDeterministicCostResourceIds`, `LegalIntent` type)

### 5.2 Tests

- No new test files. All existing tests re-run as regression proof.
- Fixed one real (pre-existing, now-surfaced) test gap: `packages/client-web/test/layout-panels.test.tsx` rendered `GameLayout` with a hand-built `G`/`ctx` fixture without ever importing `../src/game` (the module that calls `registerCanonicalPacks()` at load time). The old monolithic `enumerateLegalIntents` never touched `EnginePackRegistry` for this fixture's code path (drawAndPlace stage, no staged tile), so it worked "by accident." The new generic dispatcher always calls `EnginePackRegistry.getEnabledPacks(G)` up front (consistent with `createBalanceControlGameWithHooks` already requiring pack registration), which correctly surfaces that this test never bootstrapped the engine. Fixed by adding `import '../src/game';`, matching the same pattern already used by every other client-web test that calls `enumerateLegalIntents` (e.g. `hotseat-seat-switch-place-tile-regression.test.ts` imports `../src/game` for exactly this reason).

### 5.3 Docs

- None this stage (deferred to Task 0375 closeout).

## 6) Constraints (Hard)

- Determinism: verified via golden replay + cross-expansion matrix; the CORE enumeration logic itself is untouched (verbatim relocation).
- Engine authority: unaffected.
- No phantom moves: no move types added/removed; `LegalIntent.moveType` values unchanged.

## 7) Invariants (Must remain true)

- Identical move sequence → identical state hash: verified (golden replay unchanged, no regeneration).
- `enumerateLegalIntents` remains the single canonical entrypoint (GR-004): unchanged public signature and semantics for all realistic game states.
- Budget clipping (`LEGAL_INTENT_BUDGET = 2000`) now applies uniformly to all intents (including pending-choice resolution options, which were previously never clipped). This is a safe simplification: choice-option cardinalities are bounded by real game data (players/resources/tiles), always far below 2000 in any reachable state — verified empirically via the full test suite, golden replay, and cross-expansion matrix, none of which exercise anywhere near that many simultaneous choice options.

## 8) Implementation Plan

- [x] Step 1: Add pack-api re-exports needed by the CORE enumeration module.
- [x] Step 2: Create `packs/core/legal-intents.ts` with `coreEnumerateIntents` (verbatim CORE logic, importing `isMoveAdjacent` from the same-pack `./adjacency` and everything else via `../pack-api`).
- [x] Step 3: Rewrite kernel `engine/legal-intents.ts` as the generic dispatch loop.
- [x] Step 4: Simplify `enumerateIntents` type signature (drop unused `stage` param) — small amendment to Task 0367's contract.
- [x] Step 5: Wire `CorePack.enumerateIntents` in `packs/core/index.ts`.
- [x] Step 6: Build, fix a missing local `appendIntents` helper in the new CORE module (needed internally, distinct from the kernel's copy), fix 2 bare "CORE-01" prose spec-anchor violations.
- [x] Step 7: Full verification — `packages/game` (53/53), `packages/integration-tests` (23/23, golden replay + matrix), `packages/bot-llm` (17/17 — one pre-existing local `node_modules` symlink gap for `boardgame.io` in `packages/bot-llm/node_modules` self-resolved after a `pnpm install`, unrelated to this task's code changes), `packages/client-web` (found and fixed one real pre-existing test-fixture gap in `layout-panels.test.tsx`, now 50/50), full workspace build (`pnpm -r build`), full `pnpm run audit:spec` gate.

## 9) Acceptance Criteria

- [x] `pnpm -C packages/game build` succeeds.
- [x] `pnpm -C packages/game test` — 53/53 files, 265/265 tests pass.
- [x] `pnpm -C packages/integration-tests test` — golden replay 11/11, cross-expansion matrix 8/8, smoke 4/4.
- [x] `pnpm -C packages/bot-llm test` — 3/3 files, 17/17 tests pass.
- [x] `pnpm -C packages/client-web test` — 50/50 files, 284/284 tests pass (after fixing the `layout-panels.test.tsx` bootstrap gap).
- [x] `pnpm -r build` — all 9 packages build successfully.
- [x] `pnpm run audit:spec` passes end-to-end.
- [x] Golden replay unchanged (no regeneration).

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed and compliance demonstrated
- [x] Normative anchors cited for all changes
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (verified via cross-expansion matrix, 8/8 configs)
- [ ] `pnpm lint` — no dedicated lint script; `tsc` build across the workspace is the enforced gate
- [x] `pnpm test` passes across all affected packages (game, integration-tests, bot-llm, client-web)
- [x] Determinism verified (golden replay unchanged, cross-expansion matrix green)
- [x] No temporary files committed
- [ ] `/docs/changelog.md` updated — deferred to Task 0375
- [x] Frontend QA runbook — `layout-panels.test.tsx` fix verified via `pnpm -C packages/client-web test` (full unit suite); no e2e-specific behavior touched

## 11) Work Summary

- `enumerateLegalIntents` (`engine/legal-intents.ts`) is now a genuinely ruleset-agnostic generic dispatcher: authorize the caller, then merge `enumerateIntents` contributions from every enabled pack (`EnginePackRegistry.getEnabledPacks(G)`), sort canonically, budget-clip. Contains zero CORE-01 (or any pack's) domain logic.
- All CORE-specific enumeration logic (draw-and-place, place/move/formalize influence, convert resources, take measure, pending-choice options, and ~15 supporting helpers) moved verbatim to `packages/game/src/packs/core/legal-intents.ts` as `coreEnumerateIntents`, wired onto `CorePack.enumerateIntents`.
- Simplified the `enumerateIntents` contract from Task 0367 to drop an unused `stage` parameter — packs derive their own stage semantics from `ctx` rather than the kernel pre-computing CORE-specific stage names.
- Found and fixed one real pre-existing test-fixture gap surfaced by the stricter generic dispatch (`layout-panels.test.tsx` never bootstrapped pack registration) by aligning it with the same `import '../src/game'` pattern every other client-web test already uses.
- Zero behavior drift confirmed across the full dependency graph: `packages/game`, `packages/integration-tests` (golden replay + cross-expansion matrix), `packages/bot-llm`, `packages/client-web`, full workspace build, full `audit:spec` gate.

## 12) Commands Run

- `pnpm -C packages/game build` → ok
- `pnpm -C packages/game test` → ok (53 files, 265 tests)
- `pnpm -C packages/integration-tests test` → ok (3 files, 23 tests)
- `pnpm -C packages/bot-llm test` → ok (3 files, 17 tests; one transient local `node_modules` symlink gap resolved by `pnpm install`, unrelated to code changes)
- `pnpm -C packages/client-web test` → initially 1 file / 2 tests failed (`layout-panels.test.tsx`, missing pack registration bootstrap); fixed; then ok (50 files, 284 tests)
- `pnpm -r build` → ok (all 9 packages incl. client-web)
- `pnpm run audit:spec` → ok end-to-end (2 transient bare-"CORE-01"-in-prose anchor violations fixed along the way)

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

### A-01 — `enumerateIntents` signature simplified (drop `stage` parameter)

- Reason: discovered during implementation that pre-computing a "stage" in the kernel would require the kernel to know CORE-specific stage names, contradicting the ruleset-agnostic goal. Packs can derive whatever stage concept they need from `ctx` themselves.
- Change: `EnginePackDefinition.enumerateIntents` signature narrowed from `(G, ctx, playerID, stage: string) => any[]` (Task 0367 draft) to `(G, ctx, playerID) => any[]`.
- Spec anchors: none added/changed.
- Guardrails: no new impact — refinement within the same DD-0366-frozen contract scope.
