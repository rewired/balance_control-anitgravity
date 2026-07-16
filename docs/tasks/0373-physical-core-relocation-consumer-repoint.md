# Task 0373 — Physical Relocation of CORE Files + Consumer Repoint

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
- GR-004
- GR-006
- GR-007
- GR-009
- GR-010
- GR-011
- GR-012

### compliance_notes

- GR-001/GR-009 (State Authority/Zone Invariants): Zero state-shape change — every file move is a verbatim relocation; verified via golden replay (unchanged, no regeneration) and the full cross-expansion matrix.
- GR-002 (Engine-only Rule Execution): Rule execution now lives in `@balance-control/core` (a registered pack) instead of `packages/game` directly — still fully engine/pack-owned, per GR-002's explicit allowance ("implementations may reside in packages/game or registered packs").
- GR-003 (Determinism): Verified via golden replay (11/11, no regeneration) and 8/8 cross-expansion matrix configs after every fix in this task.
- GR-004 (Single Legal Action Interface): `enumerateLegalIntents` remains the sole entrypoint (kernel, unchanged signature); its CORE contribution moved but the dispatch mechanism (Task 0370) is untouched by this relocation.
- GR-006 (Pending Choice Gate): Unaffected — gate logic already lived in the kernel dispatcher (Task 0370), untouched here.
- GR-007 (CPU Resolution Order): Unaffected — `EffectResolver` stays in the kernel, unchanged.
- GR-010 (Start Committee Immunity): Unaffected — `isMoveAdjacent`'s Start-Committee/Bridge logic moved verbatim (Task 0369), untouched here beyond the physical file move already completed in that task.
- GR-011 (Production Canon): Unaffected — production atoms/majority computation moved verbatim; canonical order enforced by the kernel `EffectResolver`, unchanged.
- GR-012 (Match Config Canonical): Unaffected — `EnginePackRegistry`/config reading stays in the kernel, unchanged.

### guardrail_gate

- [x] I read the guardrails file before implementation.
- [x] I can explain compliance for every affected GR-xxx.
- [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

### assumptions_precedence

- [x] I applied the document precedence rule: `SEC > DD > TDD > AGENTS > VISION`.
- [x] Class presence/absence documented: SEC absent, DD present (DD-0366), TDD absent, AGENTS present, VISION absent.

## 1) Primary Spec Anchors (MUST)

All `@rule` tags on moved files are unchanged (verbatim relocation) — `pnpm run check:spec-anchors` confirms zero invalid references post-move. Representative anchors relocated: CORE-01-03-03A/04-01/04-03/07-01/02/03/03D/09-01/01A/02/03/04 (root turn structure, now in `packages/core/src/engine/root-pack.ts`), CORE-01-04-05/05A/08/09/12/12A/12B/12D and CORE-01-08-06/06E (legal-intent enumeration, now in `packages/core/src/engine/legal-intents.ts`), CORE-01-04-12D/08-06D/06E (Start-Committee/Bridge adjacency, `packages/core/src/engine/adjacency.ts`).

## 2) Goal

- Physically move every CORE-01-domain source file (per the hand-off doc's MOVE classification, refined across Tasks 0368–0371) from `packages/game/src` into the new `packages/core/src`, flattening the former `packs/core/**` nesting into `packages/core/src/engine/**` (mirroring `expansion-01/02/03`'s single-package shape).
- Repoint every internal import: files moving together keep their relative paths where directory depth is preserved; imports of kernel-only symbols become `@balance-control/game` package imports; the removed `pack-api.ts` indirection layer is fully replaced by direct `@balance-control/game` imports (no longer needed once CORE is outside `packages/game/src/packs/**`).
- Repoint external consumers (`packages/packs`, `packages/client-web`) that imported `CorePack`/`CoreMoves`/`selectTileController`/`withReplaySink` from `@balance-control/game` to `@balance-control/core` instead.
- Relocate the ~40 test files whose imports are now broken by the source move into `packages/core/test/`, plus copy the 3 generic synthetic-pack test helpers (`dummyPacks.ts`, `makeTestPack.ts`, `measureMoves.ts`) so both kernel and CORE test suites remain self-sufficient.
- Regenerate `docs/architecture/CORE-01-OBLIGATIONS.json`'s evidence file paths to match the new locations (discovered via `audit:core-obligations` reporting 345 evidence orphans after the move).

## 3) Non-Goals

- Does not do the fine-grained "should this test use a synthetic pack instead of the real one" triage — that's Task 0374.
- Does not touch `packages/expansion-01/02/03` or their consumers.

## 4) Inputs

- `docs/hand-off/dependency-cut-map-core-extraction.md` (original MOVE/STAY classification)
- The in-place CORE files already created in Tasks 0368–0371 (`packages/game/src/packs/core/{adjacency,root-pack,legal-intents,state}.ts`)
- `packages/expansion-01/**` (structural template, confirmed again during Task 0372)

## 5) Outputs

### 5.1 Code — physical moves (git mv, history preserved)

- **Setup/mechanics/moves/replay** (top-level in `packages/core/src`): `setup.ts`, `mechanics.ts`, `mechanics-turn.ts`, `mechanics-draw.ts`, `mechanics/conversion.ts`, `public-selectors.ts`, `replay.ts`, `replay-verify.ts`, `replay-verify-cli.ts`, `moves.ts`, `moves/**` (index, shared, stages/drawAndPlace, stages/politicalAction/*, system/resolveChoice)
- **Engine atoms** (`packages/core/src/engine/`): `atoms/{choice,hotspot,influence,measure,production,resource,rules}.ts`, `core-module.ts`, `cost-bucket-utils.ts`, `deterministic-cost.ts` (reclassified from STAY to MOVE after discovering `deterministic-cost.ts` hardcodes `CoreZoneName.PersonalSupply` — see Amendment A-01)
- **Flattened `packs/core/*` → `engine/*`**: `adjacency.ts`, `index.ts` (the `CorePack` definition), `legal-intents.ts`, `root-pack.ts`, `state.ts`, `tile-loader.ts`, `resources/core-tiles.json`
- **New file**: `packages/core/src/engine/replay.ts` — extracted from `engine/replay-sink.ts` (see Amendment A-02)
- **New file**: `packages/game/src/ensure-required-pack-registered.ts` — generalized replacement for the deleted `packs/register-core.ts`
- **Deleted from kernel**: `packages/game/src/packs/core/**`, `packages/game/src/packs/pack-api.ts`, `packages/game/src/packs/register-core.ts`

### 5.2 Contract additions (amendments to Tasks 0367/0368)

- `EnginePackDefinition.setupGame?: (ctx, setupData) => GameState` — required-pack-only, replaces the kernel's hardcoded `SetupGame` import (see Amendment A-01)
- `EnginePackDefinition.wrapMovesForReplay?: (moves, replayHook?) => MoveMap` — required-pack-only, replaces the kernel's hardcoded `withReplaySink` import (see Amendment A-02)
- Kernel barrel (`packages/game/src/index.ts`) gained ~25 new re-exports needed by the relocated CORE files: `topology.ts`'s hex functions, `engine/types.ts` types, `engine/resolver/{ids,modifiers,prohibitions,costs}.ts` internals, `EngineModuleRegistry`, `move-assembly.ts`'s remaining builder functions, `state-lookup.ts`'s generic helpers, `MoveMap`/`MoveFn`/`MoveModule` types, `ReplaySystemRoundSettlementPayload`/`ReplayTileRef` types.

### 5.3 Consumer repoints

- `packages/packs/src/index.ts` + `package.json` + `tsconfig.json`: `CorePack` now imported from `@balance-control/core`
- `packages/client-web`: `HexBoard.tsx` (`selectTileController`), `test/hotseat-replay-forwarding.test.ts` (`withReplaySink`, previously reached via a pre-existing deep relative import into `../../game/src/engine/replay-sink` — now a proper `@balance-control/core` package import), `test/inspector-selection-when-inactive-seat.test.tsx` (mock split); `package.json`/`tsconfig.json`/`vite.config.ts` gained the `@balance-control/core` dependency/alias/include entry

### 5.4 Tests

- ~43 test files (41 relocated + 1 newly-discovered `replay-sink.test.ts` per Amendment A-02, + the pre-existing `pack-integrity.test.ts` placeholder) now live in `packages/core/test/`, all with import paths fixed
- 3 synthetic-pack helpers copied to `packages/core/test/_helpers/` (`dummyPacks.ts`, `makeTestPack.ts`, `measureMoves.ts`), imports repointed to `@balance-control/game`
- New guardrail test: `packages/game/test/no-core-package-imports.test.ts` — asserts no kernel test ever imports `@balance-control/core` (DD-0366 Decision 5, added early since the boundary was already being drawn)
- `packages/game/test/pack-boundary-imports.test.ts`'s `EXCLUDED_ROOT_FILES` cleaned up (removed references to the now-deleted `pack-api.ts`/`register-core.ts`)

### 5.5 Docs

- `docs/architecture/CORE-01-OBLIGATIONS.json`: 371 evidence path references rewritten across ~193 entries to point at the new `packages/core/**` locations (see Amendment A-03)

## 6) Constraints (Hard)

- Zero behavior drift: every stage of this task was followed by a full build + test cycle across all 10 packages.
- No circular dependency: `packages/game` has zero dependency (build, runtime, or type-only) on `@balance-control/core`.

## 7) Invariants (Must remain true)

- Identical move sequence → identical state hash: verified via golden replay (11/11, no regeneration) after the full relocation.
- `pnpm run audit:spec` (spec anchors + pack verification + core-obligations + tripwire suites + golden replay) passes end-to-end.

## 8) Implementation Plan

- [x] Step 1: Add missing kernel barrel exports needed by relocated files (topology, resolver internals, engine/types, move-assembly builders, EngineModuleRegistry, state-lookup generics, MoveMap types).
- [x] Step 2: Generalize `ensureCorePackRegistered` → `ensureRequiredPackRegistered` (new file, kernel-level, not pack-scoped); update `index.ts`/`move-assembly.ts` callers; delete `packs/register-core.ts`.
- [x] Step 3: Discover and fix a second hardcoded-CORE-dependency in the kernel factory: `setup: (ctx, setupData) => SetupGame(...)` — add the `setupGame` pack hook, mirroring turn/endIf/playerView.
- [x] Step 4: Discover a deep entanglement in `engine/replay-sink.ts` (CORE-specific Influence-projection/majority logic embedded in the otherwise-generic `withReplaySink`/`emitReplaySystemRecord`) — split it: kernel keeps only type definitions + trivial `projectReplayStateSnapshot`; runtime logic moves to new `packages/core/src/engine/replay.ts`, exposed via a new `wrapMovesForReplay` pack hook.
- [x] Step 5: `git mv` every MOVE-classified source file into `packages/core/src/**`, flattening `packs/core/*` into `engine/*`.
- [x] Step 6: Rewrite every moved file's imports (kernel-only symbols → `@balance-control/game`; sibling CORE files → relative, mostly unchanged since directory depth is preserved except for the flattened `packs/core/*` files).
- [x] Step 7: Reclassify `engine/cost-bucket-utils.ts`/`engine/deterministic-cost.ts` from STAY to MOVE after discovering they hardcode `CoreZoneName.PersonalSupply` and are consumed exclusively by CORE files.
- [x] Step 8: Scaffold-fill `packages/core/src/engine/index.ts` (the real `CorePack`), wiring all 8 hooks (`turn`, `endIf`, `playerView`, `enumerateIntents`, `updateStats`, `setupGame`, `wrapMovesForReplay`, plus `moves`/`setup`/`engine.atoms`).
- [x] Step 9: Repoint `packages/packs` and `packages/client-web` (package.json, tsconfig.json, vite.config.ts, source + test files) to `@balance-control/core` for the symbols that moved.
- [x] Step 10: Add `boardgame-io.d.ts` ambient-module shim to `packages/core` (discovered the installed `boardgame.io@0.50.2` package ships no `.d.ts` files for the bare `boardgame.io` import; the kernel already carries a local shim for exactly this).
- [x] Step 11: Move all test files broken by the source relocation into `packages/core/test/`; fix their import paths (bulk `sed` for the mechanical majority, manual fixes for ambiguous cases like `engine/legal-intents` and `../src/index`).
- [x] Step 12: Copy the 3 generic synthetic-pack test helpers into `packages/core/test/_helpers/`.
- [x] Step 13: Add the `no-core-package-imports.test.ts` kernel guardrail test; clean up `pack-boundary-imports.test.ts`'s stale exclusion list.
- [x] Step 14: Fix the `docs/architecture/CORE-01-OBLIGATIONS.json` evidence-path regression surfaced by `audit:core-obligations` (345 orphans) with a scripted remap (371 replacements across ~193 entries), splitting the three files that themselves split (`index.ts`→`root-pack.ts` for turn/endIf entries, `legal-intents.ts`→`packages/core/...` for all referencing entries, `topology.ts`→`adjacency.ts` only for the 4 Start-Committee/Bridge-specific rule IDs).
- [x] Step 15: Full verification loop across all 10 packages after every fix, until everything was green.

## 9) Acceptance Criteria

- [x] `pnpm -r build` — all 10 packages (incl. `client-web`) build successfully.
- [x] `pnpm -C packages/game test` — 11/11 files, 23/23 tests (down from 53/265 pre-relocation — the kernel test suite is now genuinely pack-agnostic).
- [x] `pnpm -C packages/core test` — 44/44 files, 244/244 tests.
- [x] `pnpm -C packages/integration-tests test` — golden replay 11/11 (no regeneration), cross-expansion matrix 8/8, smoke 4/4.
- [x] `pnpm -C packages/bot-llm test` — 3/3 files, 17/17 tests.
- [x] `pnpm -C packages/client-web test` — 50/50 files, 284/284 tests.
- [x] `pnpm -C packages/server test` — 2/2 files, 3/3 tests.
- [x] `pnpm run audit:spec` passes end-to-end, including `audit:core-obligations` (0 evidence orphans, was 345).
- [x] `git status` shows only intended changes (verified via full diff review).

## 10) PR Checklist (Repo Artifact)

- [x] Guardrails: affected GR-xxx listed and compliance demonstrated
- [x] Normative anchors cited for all changes (verbatim relocation, zero anchor changes, `check:spec-anchors` clean)
- [x] No implicit rules introduced
- [x] No phantom moves introduced
- [x] Expansion isolation preserved (verified via cross-expansion matrix, 8/8 configs)
- [ ] `pnpm lint` — no dedicated lint script; full-workspace `tsc` build is the enforced gate
- [x] `pnpm test` passes across all 7 testable packages
- [x] Determinism verified (golden replay unchanged, cross-expansion matrix green)
- [x] No temporary files committed (scratch remap script removed after use)
- [ ] `/docs/changelog.md` updated — deferred to Task 0375
- [x] Frontend QA runbook — client-web full unit suite re-run as regression proof (50/50 files); no UI-visible behavior change

## 11) Work Summary

- Completed the physical extraction of CORE-01 from `packages/game` into `packages/core`, closing the architectural gap identified in Task 0366: `packages/game` is now a genuinely ruleset-agnostic kernel (boardgame.io wiring, pack registry, resolver, move assembly, replay infrastructure types, default hex topology) with **zero** CORE-01 domain logic remaining in it.
- Along the way, discovered and fixed two additional hardcoded-CORE dependencies in the kernel that had survived Task 0368's turn/endIf/playerView extraction: the `setup:` field (hardcoded `SetupGame` import) and `withReplaySink`'s Influence-projection/majority logic embedded in `engine/replay-sink.ts`. Both are now pack-supplied hooks (`setupGame`, `wrapMovesForReplay`), consistent with the established `turn`/`endIf`/`playerView`/`enumerateIntents`/`updateStats` pattern.
- Reclassified `engine/cost-bucket-utils.ts`/`engine/deterministic-cost.ts` from STAY to MOVE after discovering they hardcode `CoreZoneName.PersonalSupply` and have zero non-CORE consumers.
- Repointed all external consumers (`packages/packs`, `packages/client-web`) from `@balance-control/game` to `@balance-control/core` for the symbols that moved, including one incidental improvement: a pre-existing deep relative import (`client-web` reaching into `../../game/src/engine/replay-sink` directly) is now a proper package import.
- Relocated ~43 test files whose imports broke as a direct consequence of the source move; copied 3 generic synthetic-pack test helpers so both kernel and CORE suites remain self-sufficient; added a durable static-analysis guardrail (`no-core-package-imports.test.ts`) enforcing DD-0366 Decision 5 going forward.
- Fixed a 345-entry evidence-path regression in `docs/architecture/CORE-01-OBLIGATIONS.json` surfaced by `audit:core-obligations`, with careful per-rule-ID handling for the three files that themselves split across the kernel/CORE boundary.
- Zero behavior drift at every step, confirmed by golden replay + cross-expansion matrix + the full test suite across all 7 testable packages, run repeatedly throughout this task as fixes landed.

## 12) Commands Run

- `pnpm -r build` → ok (all 10 packages)
- `pnpm -C packages/game test` → ok (11 files, 23 tests)
- `pnpm -C packages/core test` → ok (44 files, 244 tests)
- `pnpm -C packages/integration-tests test` → ok (3 files, 23 tests)
- `pnpm -C packages/bot-llm test` → ok (3 files, 17 tests)
- `pnpm -C packages/client-web test` → ok (50 files, 284 tests)
- `pnpm -C packages/server test` → ok (2 files, 3 tests)
- `pnpm run audit:spec` → ok end-to-end (including a fixed `audit:core-obligations`, 0 evidence orphans)

## 13) Postflight Proof (recorded in commit message)

### 13.1 Recorded

Recorded in final commit message (Postflight: block).

## 14) Commit Proof (recorded in commit message)

### 14.1 Recorded

Recorded in final commit message (Postflight: block).

## 15) Amendments (append-only)

### A-01 — `setupGame` pack hook added

- Reason: discovered during the move that `packages/game/src/index.ts` still hardcoded `import { SetupGame } from './setup'` and called it directly in the `Game.setup` field — a second CORE-specific dependency in the kernel factory that Task 0368 missed (it only addressed `turn`/`endIf`/`playerView`).
- Change: `EnginePackDefinition` gained `setupGame?: (ctx, setupData) => GameState`, required-pack-only (added to the single-owner validation alongside turn/endIf/playerView). Kernel's `setup:` field now calls `requiredPack.setupGame!(ctx, setupData)`.
- Spec anchors: none added/changed (infrastructure).
- Guardrails: no new impact — same governance model as the existing root-pack hooks.

### A-02 — `wrapMovesForReplay` pack hook added; `engine/replay-sink.ts` split

- Reason: discovered that `withReplaySink`/`emitReplaySystemRecord` (previously classified STAY, "generic infra") actually embed CORE-specific logic throughout: `projectPlayerInfluence` (hardcodes `CoreZoneName.PersonalSupply`), `moveType === 'placeInfluence'`/`'resolveChoice'`/`'placeTile'` conditionals baked into the generic move-wrapping loop, and `emitReplaySystemRecord`'s call to `computeMajority` (CORE's canonical majority algorithm). This could not be fixed by a simple import-path change without breaking the circular-dependency constraint (kernel cannot import from `@balance-control/core`).
- Change: kernel's `engine/replay-sink.ts` now contains only type definitions (`ReplayRecord`, `ReplayHookOptions`, etc.) plus the trivial `projectReplayStateSnapshot`. The full runtime logic (`withReplaySink`, `emitReplaySystemRecord`, `projectReplayCheckpointSummary`, and their private helpers) moved to new `packages/core/src/engine/replay.ts`. `EnginePackDefinition` gained `wrapMovesForReplay?: (moves, replayHook?) => MoveMap`, required-pack-only. Kernel's `createBalanceControlGameWithHooks` now calls `requiredPack.wrapMovesForReplay?.(packAssembly.moves, replayHook) ?? packAssembly.moves` instead of importing `withReplaySink` directly (required-pack resolution moved earlier in the function to support this).
- Spec anchors: none added/changed.
- Guardrails: no new impact — same governance model. Verified zero behavior drift via `packages/core/test/replay-sink.test.ts` (relocated, 12 tests) and the full golden-replay/cross-expansion-matrix suite.

### A-03 — `docs/architecture/CORE-01-OBLIGATIONS.json` evidence paths remapped

- Reason: `pnpm run audit:core-obligations` (part of `audit:spec`) reported 345 "evidence orphan" entries after the physical file move — the registry hardcodes evidence file paths per spec ID and checks `fs.existsSync` on each; moved files broke these checks.
- Change: wrote a one-off Node script (not committed — scratch, deleted after use) to remap all 40 unique `packages/game/**` evidence paths referenced in the registry to their new locations, with per-rule-ID handling for the three files that themselves split across the kernel/CORE boundary during this task chain (`index.ts` → `root-pack.ts` only for turn/endIf/settlement rule IDs; `legal-intents.ts` → `packages/core/...` for all referencing IDs since the whole enumeration content moved; `topology.ts` → `adjacency.ts` only for the 4 Start-Committee/Bridge-specific rule IDs, since the base `Adjacent()` contract stayed in the kernel per DD-0366 Decision 2). 371 evidence-string replacements applied across ~193 entries; `audit:core-obligations` now reports 0 evidence orphans.
- Spec anchors: none added/changed — only evidence *locations* updated, not the spec IDs or rule text themselves.
- Guardrails: no new impact — this is a documentation/tooling consistency fix, not a rule or behavior change.
