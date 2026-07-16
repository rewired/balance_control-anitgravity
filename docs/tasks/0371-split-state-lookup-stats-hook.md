# Task 0371 — Split State-Lookup Stats Bookkeeping into a Pack Hook

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

### compliance_notes

- GR-001 (Engine State Authority): No state shape change; `G.meta.stats` continues to be populated identically, just computed by a pack-supplied hook instead of a hardcoded kernel function.
- GR-002 (Engine-only Rule Execution): `EffectResolver.resolve()` (kernel) no longer directly calls a CORE-specific stats function; it dispatches to the required pack's `updateStats` hook, same pattern as `turn`/`endIf`/`playerView` (DD-0366).

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

- [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
- [x] Class presence/absence documented: SEC absent, DD present (DD-0366), TDD absent, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

- CORE: CORE-01-09-03 (unchanged, relocated verbatim)
- ARCH: DD-0366 (root-pack contract, extended with `updateStats`)

## 2) Goal

- Split `state-lookup.ts`: keep the two genuinely generic helpers (`getPlayerMetaMarker`, `findObjectZoneId`); move the CORE-specific `countBoardInfluence`/`updateGlobalStats` (board-influence/meta-marker stats bookkeeping) to `packages/game/src/packs/core/state.ts`.
- Replace the kernel's direct call to this CORE-specific function (found in `engine/resolver.ts`, the generic `EffectResolver.resolve()` — a real boundary leak discovered during this task) with a new `updateStats` pack hook, following the same required-pack-dispatch pattern as `turn`/`endIf`/`playerView`.

## 3) Non-Goals (scope narrowed from the original plan — see Amendment A-01)

- Does **not** split `public-selectors.ts` — on inspection it is a 3-line pass-through to `computeMajority` (already 100% CORE content per the hand-off doc's classification, not a mixed-concern file). It moves wholesale alongside `mechanics.ts` in Task 0373; no split is needed now.
- Does **not** split `replay-verify.ts` in this task. On inspection, this file is overwhelmingly CORE-domain content (move-name-specific invariant checks, `CoreZoneName`/Influence-type assumptions) tightly interleaved with a small amount of generic NDJSON-shape validation, in the same function bodies. Introducing a new `verifyMoveInvariants` pack-hook abstraction now (as originally sketched in the plan) would be a materially larger, riskier lift for a comparatively low-value dev/ops verification tool, for no behavior benefit today. It moves wholesale in Task 0373; its `ensureCorePackForReplayVerifier` bootstrap hardcoding gets a minimal generalization at that point instead of a new hook abstraction.

## 4) Inputs

- `packages/game/src/state-lookup.ts` (pre-change: 4 functions, 2 generic + 2 CORE-specific)
- `packages/game/src/engine/resolver.ts` (`EffectResolver.resolve()`, calling `updateGlobalStats` directly — the boundary leak this task fixes)
- `packages/game/src/setup.ts` (calls `updateGlobalStats` once, at initial setup)

## 5) Outputs

### 5.1 Code

- `packages/game/src/state-lookup.ts` — now only `getPlayerMetaMarker`, `findObjectZoneId`
- `packages/game/src/packs/core/state.ts` — new file: `countBoardInfluence`, `coreUpdateStats`
- `packages/game/src/packs/core/index.ts` — `CorePack.updateStats = coreUpdateStats`
- `packages/game/src/packs/types.ts` — added `updateStats?: (G, ctx) => void` to `EnginePackDefinition` (required-pack-only, same governance as `turn`/`endIf`/`playerView`)
- `packages/game/src/packs/pack-api.ts` — added `findObjectZoneId` re-export (alongside the already-present `getPlayerMetaMarker`)
- `packages/game/src/engine/resolver.ts` — replaced the direct `updateGlobalStats(G, ctx)` call with `EnginePackRegistry.getRegisteredPacks().find(p => p.manifest.required)?.updateStats?.(G, ctx)`
- `packages/game/src/setup.ts` — repointed its one `updateGlobalStats` call to `coreUpdateStats` from `./packs/core/state`

### 5.2 Tests

- No new test files; full regression suite re-run.

### 5.3 Docs

- None this stage (deferred to Task 0375 closeout).

## 6) Constraints (Hard)

- Determinism: unaffected — verbatim logic relocation, verified via golden replay + cross-expansion matrix.
- Engine authority: strengthened, not weakened — the kernel's resolver no longer contains CORE-specific stats logic at all.

## 7) Invariants (Must remain true)

- `G.meta.stats` shape and values are byte-identical to before (verbatim relocation) — verified via the full test suite and golden replay (no consumers of `G.meta.stats` exist anywhere in the repo today, confirmed via repo-wide grep, so this is a low-risk internal-only change).
- Identical move sequence → identical state hash: verified.

## 8) Implementation Plan

- [x] Step 1: Add `updateStats?` field to `EnginePackDefinition`.
- [x] Step 2: Move `countBoardInfluence`/`updateGlobalStats` (renamed `coreUpdateStats`) to `packs/core/state.ts`.
- [x] Step 3: Slim `state-lookup.ts` to the two generic helpers.
- [x] Step 4: Add `findObjectZoneId` re-export to `pack-api.ts`.
- [x] Step 5: Wire `CorePack.updateStats`.
- [x] Step 6: Fix the `engine/resolver.ts` boundary leak — dispatch to the required pack's `updateStats` hook instead of a direct CORE import.
- [x] Step 7: Repoint `setup.ts`'s one call site.
- [x] Step 8: Full verification: `packages/game`, `packages/integration-tests` (golden replay + matrix), `packages/bot-llm`, `packages/client-web`, full workspace build, full `audit:spec`.

## 9) Acceptance Criteria

- [x] `pnpm -C packages/game build` succeeds.
- [x] `pnpm -C packages/game test` — 53/53 files, 265/265 tests pass.
- [x] `pnpm -C packages/integration-tests test` — golden replay 11/11, cross-expansion matrix 8/8, smoke 4/4.
- [x] `pnpm -C packages/bot-llm test` — 3/3 files, 17/17 tests pass.
- [x] `pnpm -C packages/client-web test` — 50/50 files, 284/284 tests pass.
- [x] `pnpm -r build` — all 9 packages build successfully.
- [x] `pnpm run audit:spec` passes end-to-end.
- [x] Golden replay unchanged (no regeneration).

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed and compliance demonstrated
- [x] Normative anchors cited for all changes
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (verified via cross-expansion matrix)
- [ ] `pnpm lint` — no dedicated lint script; `tsc` build is the enforced gate
- [x] `pnpm test` passes across all affected packages
- [x] Determinism verified (golden replay unchanged)
- [x] No temporary files committed
- [ ] `/docs/changelog.md` updated — deferred to Task 0375
- [x] Frontend QA runbook — N/A, no UI-visible behavior change (client-web full suite re-run as regression proof)

## 11) Work Summary

- Discovered and fixed a real boundary leak: `engine/resolver.ts` (generic kernel resolver, `EffectResolver.resolve()`) directly called a CORE-specific stats function (`updateGlobalStats`, hardcoding `CoreZoneName`/Influence-type semantics) on every effect-queue drain. Replaced with a new `updateStats` pack hook, dispatched to the single required pack — same governance pattern as `turn`/`endIf`/`playerView` from Task 0368.
- Split `state-lookup.ts`: kept `getPlayerMetaMarker`/`findObjectZoneId` (genuinely generic), moved `countBoardInfluence`/`updateGlobalStats` (renamed `coreUpdateStats`) to `packages/game/src/packs/core/state.ts`.
- Narrowed this task's scope relative to the original plan after inspecting `public-selectors.ts` (already 100% CORE content, not mixed — no split needed, moves wholesale in Task 0373) and `replay-verify.ts` (CORE-domain logic too tightly interleaved with generic NDJSON-shape validation to safely extract a new `verifyMoveInvariants` hook abstraction now without expanding risk for a dev-tool with little behavioral upside; deferred wholesale to Task 0373). See Amendment A-01.
- Zero behavior drift confirmed across `packages/game`, `packages/integration-tests` (golden replay + cross-expansion matrix), `packages/bot-llm`, `packages/client-web`, full workspace build, full `audit:spec` gate.

## 12) Commands Run

- `pnpm -C packages/game build` → ok
- `pnpm -C packages/game test` → ok (53 files, 265 tests)
- `pnpm -C packages/integration-tests test` → ok (3 files, 23 tests)
- `pnpm -C packages/bot-llm test` → ok (3 files, 17 tests)
- `pnpm -C packages/client-web test` → ok (50 files, 284 tests)
- `pnpm -r build` → ok (all 9 packages incl. client-web)
- `pnpm run audit:spec` → ok end-to-end

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

### A-01 — Scope narrowed: drop `public-selectors.ts` and `replay-verify.ts` splits from this task

- Reason: on inspection, `public-selectors.ts` is not a mixed-concern file (3-line pass-through, already 100% CORE content) — no split is applicable, only relocation, which belongs in Task 0373. `replay-verify.ts`'s CORE-specific logic is tightly interleaved with its generic NDJSON-shape validation in shared function bodies; extracting a new `verifyMoveInvariants` pack-hook abstraction now would be a substantially larger, riskier change than this task's title implied, for a dev/ops verification tool with no runtime behavioral benefit from the split. Also discovered a genuine boundary leak in `engine/resolver.ts` not originally scoped (direct CORE stats call) — fixing that real leak was judged higher-value than force-fitting the replay-verify split into this task.
- Change: this task's scope is `state-lookup.ts` + the newly-discovered `engine/resolver.ts` leak only. `public-selectors.ts` and `replay-verify.ts` move wholesale (no further splitting) in Task 0373.
- Spec anchors: none added/changed.
- Guardrails: no new impact.
