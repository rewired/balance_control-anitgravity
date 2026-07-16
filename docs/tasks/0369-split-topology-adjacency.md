# Task 0369 — Split Generic Adjacency from CORE Move-Adjacency Rules

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
- GR-010

### compliance_notes

- GR-002 (Engine-only Rule Execution): `isMoveAdjacent`'s rule content (Start-Committee exclusion, Start-Bridge exception) still executes inside `packages/game` (now under `packs/core/`), just relocated — no client/bot code touched.
- GR-010 (Start Committee Immunity & Targeting): The Start-Committee exclusion in `isMoveAdjacent` moved verbatim; not altered.

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

- [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
- [x] Class presence/absence documented: SEC absent, DD present (DD-0366 Decision 2), TDD absent, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

- CORE: CORE-01-04-12D, CORE-01-08-06D, CORE-01-08-06E, CORE-01-00-T01, CORE-01-00-T02, CORE-01-00-T03, CORE-01-00-T07A (all unchanged, relocated verbatim)
- ARCH: DD-0366 Decision 2 (topology ownership)

## 2) Goal

- Extract a generic `isAdjacent(G, sourceId, targetId): boolean` primitive (AGENTS.md §1.4's `Adjacent(TileA,TileB)→Boolean` contract) into the kernel's `engine/topology.ts`, replacing the mixed-concern `isMoveAdjacent`.
- Move `isMoveAdjacent` (Start-Committee exclusion + Start-Bridge exception, CORE-specific) to `packages/game/src/packs/core/adjacency.ts`, calling the kernel's `isAdjacent`.

## 3) Non-Goals

- Does not move top-level `packages/game/src/topology.ts` (hex-grid math) — per DD-0366 Decision 2, this stays in the kernel as the shipped default topology.
- Does not physically relocate any file out of `packages/game` (Task 0373).

## 4) Inputs

- `packages/game/src/engine/topology.ts` (pre-change: single `isMoveAdjacent` function mixing generic + CORE concerns)
- Call sites: `packages/game/src/engine/legal-intents.ts:247`, `packages/game/src/moves/stages/politicalAction/moveInfluence.ts:41`
- Test: `packages/game/test/engine-topology.test.ts`

## 5) Outputs

### 5.1 Code

- `packages/game/src/engine/topology.ts` — now exports only generic `isAdjacent(G, a, b)`
- `packages/game/src/packs/core/adjacency.ts` — new file, exports `isMoveAdjacent` (CORE rule wrapper calling `isAdjacent`)
- `packages/game/src/packs/pack-api.ts` — added `isAdjacent` re-export (so the pack-internal `adjacency.ts` can reach it through the sanctioned indirection layer)
- `packages/game/src/engine/legal-intents.ts` — import path updated
- `packages/game/src/moves/stages/politicalAction/moveInfluence.ts` — import path updated

### 5.2 Tests

- `packages/game/test/engine-topology.test.ts` — import path updated (`isMoveAdjacent` now from `../src/packs/core/adjacency`); no assertion changes, all existing cases pass unchanged.

### 5.3 Docs

- None this stage (deferred to Task 0375 closeout).

## 6) Constraints (Hard)

- Determinism: unaffected, pure functions, no behavior change (verbatim logic relocation).
- Engine authority: unaffected.

## 7) Invariants (Must remain true)

- Identical move sequence → identical state hash: verified via golden replay (unchanged) and cross-expansion matrix.

## 8) Implementation Plan

- [x] Step 1: Extract `isAdjacent(G, a, b)` in `engine/topology.ts`, remove `isMoveAdjacent` from that file.
- [x] Step 2: Add `isAdjacent` re-export to `pack-api.ts`.
- [x] Step 3: Create `packs/core/adjacency.ts` with `isMoveAdjacent`, importing `isAdjacent` from `../pack-api`.
- [x] Step 4: Update the two real call sites (`engine/legal-intents.ts`, `moves/stages/politicalAction/moveInfluence.ts`) and the test import.
- [x] Step 5: Build, full test suite, golden replay, cross-expansion matrix, `audit:spec`.

## 9) Acceptance Criteria

- [x] `pnpm -C packages/game build` succeeds.
- [x] `pnpm -C packages/game test` — 53/53 files, 265/265 tests pass, including `pack-boundary-imports.test.ts` (new `packs/core/adjacency.ts` only imports `../pack-api`, no violation) and `engine-topology.test.ts` (all `isMoveAdjacent`/`isAdjacent`-exercising cases unchanged).
- [x] `pnpm -C packages/integration-tests test` — golden replay 11/11, cross-expansion matrix 8/8, smoke 4/4.
- [x] `pnpm run audit:spec` passes end-to-end.
- [x] Golden replay unchanged (no regeneration).

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed and compliance demonstrated
- [x] Normative anchors cited for all changes
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (verified via cross-expansion matrix)
- [ ] `pnpm lint` — no dedicated lint script; `tsc` build is the enforced gate
- [x] `pnpm test` passes
- [x] Determinism verified (golden replay unchanged)
- [x] No temporary files committed
- [ ] `/docs/changelog.md` updated — deferred to Task 0375
- [x] Frontend QA runbook — N/A, no UI touched

## 11) Work Summary

- Split `engine/topology.ts`'s single `isMoveAdjacent` function into a generic kernel primitive `isAdjacent(G, a, b)` (base adjacency-map lookup, ruleset-agnostic) and a CORE-specific `isMoveAdjacent` wrapper (Start-Committee exclusion + Start-Bridge exception) now living in `packages/game/src/packs/core/adjacency.ts`.
- Updated the two real call sites and one test import; no behavior change (verbatim logic).
- Confirms DD-0366 Decision 2: top-level `packages/game/src/topology.ts` (hex-grid math) stays in the kernel untouched, as decided.

## 12) Commands Run

- `pnpm -C packages/game build` → ok
- `pnpm -C packages/game test` → ok (53 files, 265 tests)
- `pnpm -C packages/integration-tests test` → ok (3 files, 23 tests; golden-replay 11/11, cross-expansion-matrix 8/8)
- `pnpm run audit:spec` → ok end-to-end

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

None.
