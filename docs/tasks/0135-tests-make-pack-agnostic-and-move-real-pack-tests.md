# Codex Task 0135 — TESTS: Make `packages/game` tests pack-agnostic; move real-pack coverage to integration-tests

**Date:** 2026-02-19
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0135
- **Owner:** Codex
- **Area:** `packages/game/test`, `packages/integration-tests/test`
- **Priority:** P1
- **Risk:** Medium (test reshuffle; no rules changes)
- **Branch name:** `task/0135-tests-make-pack-agnostic-and-move-real-pack-tests`

## 1) Guardrails (frozen)

- **GR-003 (Determinism Contract):** tests must remain deterministic; no ordering drift.
- **GR-002 (Engine-only Rule Execution):** tests must not move rule logic to client.
- **GR-012 (Match Config is Canonical):** tests should prefer `packs.enabledPacks`.

## 2) Spec anchors (frozen)

- `ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-002, GR-003, GR-012
- `ARCH-01-ENGINE-CONTRACT.md` — pack registration and engine authority

## 3) Context (frozen)

We want to remove the hard dependency `@balance-control/game -> @balance-control/expansion-*`.

Today, `packages/game/test/*` still imports:

- `Exp01Pack/Exp02Pack/Exp03Pack` from `@balance-control/game`, and
- (in at least one case) source files from `packages/expansion-01` directly.

That makes the engine test suite **not pack-agnostic**, and blocks the pack split.

The desired split is:

- **Engine unit tests (packages/game/test):** use **dummy packs** only.
- **Real pack combination tests:** live in `packages/integration-tests` and use `@balance-control/packs`.

## 4) Goal (frozen)

- Remove all real expansion pack imports from `packages/game/test/*`.
- Replace them with minimal dummy pack definitions (inline or shared helper).
- Ensure real pack combinations are still covered (move/extend tests under `packages/integration-tests/test/*`).

## 5) Scope (frozen)

### 5.1 In-scope

- Refactor/move tests:
  - Any test under `packages/game/test` that imports `Exp01Pack/Exp02Pack/Exp03Pack` or `@balance-control/expansion-*`.
- Add a small dummy-pack helper to reduce duplication.
- Update integration-tests to cover the scenarios that were previously covered by real packs in game tests.

### 5.2 Out-of-scope

- Removing expansion pack exports from `@balance-control/game`.
- Removing `@balance-control/game` dependencies on expansions.
- Changing any engine/pack behavior.

## 6) Plan (frozen)

### Entry criteria

- Task 0134 merged (`@balance-control/packs` exists; consumers can import packs from there).

### Steps

1) **Inventory + guard rails**
   - Find all test imports referencing:
     - `Exp01Pack|Exp02Pack|Exp03Pack`
     - `@balance-control/expansion-01|02|03`
     - `../src/packs/exp0*`

2) **Introduce dummy pack helpers**
   - Add `packages/game/test/_helpers/dummyPacks.ts` exporting:
     - `makeDummyExpansionPack({ id, name, moves?, zones?, resources?, measureDecks?, getMeasureAtoms?, effectHandlers? })`
     - Ensure dummy packs include a manifest with stable version/anchor strings.

3) **Refactor game tests to use dummy packs only**
   - For each affected test:
     - Replace `registerTestPacks([Exp0xPack])` with `registerTestPacks([makeDummyExpansionPack(...)])`.
     - If the test only needs “a pack exists/enabled,” keep it minimal (id + manifest + empty moves).
     - If the test needs measure decks / getMeasureAtoms routing, add only the minimal hooks to the dummy pack.

   Suggested target outcomes:
   - `golden-replay.test.ts`: **move** to integration-tests (real packs), and keep a **core-only** golden replay in game tests if desired.
   - `surface-hash.test.ts` / `measure-deck-provider.test.ts`:
     - Either use dummy packs, or move to integration-tests if they are meant to validate real pack manifests.
   - Any test importing `packages/expansion-01/src/*`: move to integration-tests.

4) **Extend integration-tests to keep real-pack coverage**
   - In `packages/integration-tests/test/*`:
     - Register real packs via `registerCanonicalPacks()` from `@balance-control/packs`.
     - Use canonical config surface: `{ packs: { enabledPacks: ['exp01','exp02','exp03'] } }`.
     - Add/adjust assertions to cover what was moved out.

### Exit criteria

- `packages/game/test` contains **zero** imports of `@balance-control/expansion-*` and **zero** imports of `../src/packs/exp0*`.
- Integration-tests cover at least:
  - registering real packs without collision
  - creating a game with expansions enabled
  - retrieving measure deck descriptors for enabled expansions

## 7) Acceptance Criteria (frozen)

- `pnpm -C packages/game test` passes.
- `pnpm -C packages/integration-tests test` passes.
- `grep -R "@balance-control/expansion-0" packages/game/test` has **no matches**.
- `grep -R "src/packs/exp0" packages/game/test` has **no matches**.

## 8) Files likely touched (frozen)

- `packages/game/test/*` (multiple)
- `packages/game/test/_helpers/dummyPacks.ts` (new)
- `packages/integration-tests/test/*`

## 9) Notes / hazards (frozen)

- Keep dummy pack IDs strictly within the canonical id set (`exp01/exp02/exp03`) when the test depends on canonical ordering.
- Do not introduce new move IDs; dummy moves should be inert unless the test explicitly needs them.

## 10) PR Checklist (to be completed before merge)

- [x] Game tests pass (`pnpm -C packages/game test`)
- [x] Integration tests pass (`pnpm -C packages/integration-tests test`)
- [x] No rules changes (SPEC-anchored)
- [x] `packages/game/test` contains no real expansion imports
- [x] Updated docs/hand-off/current.md if any decision/fact changed

## 11) Work Summary (fill after implementation)

- Created `packages/game/test/_helpers/dummyPacks.ts` to create dummy expansion packs for testing.
- Refactored `packages/game/test` to use dummy packs instead of importing real packs (`Exp01Pack`, etc.).
- Moved real-pack dependent golden replay tests to `packages/integration-tests/test/golden-replay.test.ts`.
- Moved expansion golden fixtures to `packages/integration-tests/test/golden/`.
- Updated `packages/game/test/golden-replay.test.ts` to run only core-only scenarios using dummy/core packs.
- Removed all imports of `@balance-control/expansion-*` and `src/packs/exp0*` from `packages/game/test`.
- Verified that `packages/game` tests pass and `packages/integration-tests` pass.

## 12) Commands Run (fill after implementation)

- `pnpm -C packages/game test` (Passed)
- `pnpm -C packages/integration-tests test` (Passed)
- `grep -r "Exp0[1-3]Pack" packages/game/test` (No imports found)

## 13) Postflight (fill after implementation)

-

## 14) Patch Notes (fill after implementation)

-

## 15) Downstream follow-ups

- Task 0136: remove `@balance-control/game` hard deps on `@balance-control/expansion-*` and stop exporting Exp packs from `@balance-control/game`.
