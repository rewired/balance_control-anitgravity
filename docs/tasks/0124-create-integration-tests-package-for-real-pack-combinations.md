# Task 0124 — Create a dedicated integration-tests package for real pack combinations (engine + core/exp)

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0124-create-integration-tests-package-for-real-pack-combinations`

---

**Task State:** DONE

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

- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
- `docs/architecture/ARCH-03-MEASURE-CPU.md`
- `docs/tasks/0122-decouple-game-tests-from-expansion-packages.md`
- `docs/tasks/0123-add-pack-local-tests-for-expansion-02-03.md`

## 2) Context

After decoupling engine unit tests (Task 0122) and adding pack-local tests (Task 0123), we still want a small amount of **real-world safety coverage** proving that the engine can run with real pack combinations (core + expansions) without reintroducing coupling inside `@balance-control/game`.

The clean place for this is a dedicated workspace package that depends on the engine and expansion packages.

## 3) Goal

- Add a new workspace package: `packages/integration-tests`.
- Add a minimal set of integration tests that:
  - import `@balance-control/game`
  - import real packs (core + at least EXP-02 and EXP-03)
  - register packs and create a game config
  - execute a small deterministic smoke-flow (no UI, no server)

## 4) Non-Goals

- Do not add end-to-end UI tests here (Playwright already exists).
- Do not create long scenario simulations or golden replays.
- Do not refactor engine/pack code beyond what is needed for the tests.

## 5) Inputs

- Workspace tooling (pnpm).
- Existing pack registration APIs (`registerPack`, `assemblePacks`, `createBalanceControlGame` or equivalents).
- Real pack packages:
  - `@balance-control/expansion-core` (when it exists) or current core pack provider
  - `@balance-control/expansion-02`
  - `@balance-control/expansion-03`

NOTE: If core is still provided via `@balance-control/game` at this moment, the integration-tests package may import core from the current canonical place, but must be ready to change once core is extracted.

## 6) Outputs

- New workspace directory `packages/integration-tests` with:
  - `package.json` (private, test script)
  - `tsconfig.json`
  - `src/` (optional)
  - `test/` containing at least one integration smoke test

- Integration smoke test(s) that validate:
  1) packs can be registered together without collisions
  2) a minimal deterministic sequence can run (e.g. create game state, call a simple move if accessible, or at least build the assembled pack set)
  3) multi-expansion measure dispatch routing is not ambiguous (only a minimal assertion; not a full scenario)

## 7) Constraints (Hard)

- `packages/game/test/*` must remain expansion-independent; integration-tests are the only place where real expansion packages are combined.
- Tests must be deterministic and avoid timers/threads (use the same vitest flags as other packages).
- Keep runtime small (smoke tests only).

## 8) Implementation Plan

1. Create `packages/integration-tests` with standard `vitest` test script:
   - `vitest run --no-threads --sequence.concurrent false`
2. Add dependencies on `@balance-control/game` and on the real expansion packages needed.
3. Write a smoke test that:
   - imports the engine and pack definitions
   - registers packs in a canonical order
   - assembles/creates the game
   - runs 1–2 assertions that demonstrate the combined system loads and basic invariants hold
4. Ensure `pnpm -r test` runs the new package tests.

## 9) Acceptance Criteria

- [x] `packages/integration-tests` exists and is wired into the workspace.
- [x] At least one integration test imports real expansion packs and passes.
- [x] `pnpm -r test` is green.
- [x] Engine package tests still have zero imports from real expansion packages.

## 10) PR Checklist (Repo Artifact)

- [x] Task State progressed correctly (DRAFT→FROZEN before edits; DONE only at end).
- [x] Single commit on the task branch.
- [x] `pnpm -r test` executed; results recorded in Section 12.
- [x] No unrelated formatting churn.
- [x] Postflight proof captured (per AGENTS) and included in commit message.

## 11) Work Summary (3–7 bullets)

- Created `packages/integration-tests` as a new workspace package.
- Configured `package.json`, `tsconfig.json`, and `vitest.config.ts` for the new package.
- Implemented `test/smoke.test.ts` to verify that `CorePack`, `Exp01Pack`, `Exp02Pack`, and `Exp03Pack` can be registered together in `EnginePackRegistry`.
- Verified that `createBalanceControlGame()` initializes correctly with all expansions enabled.
- Confirmed that expansion-specific zones (like `CoreZoneNames.DrawPile`) and measure decks are correctly loaded.
- Validated that `pnpm -r test` passes for the entire workspace, including the new integration tests.

## 12) Commands Run (with outcomes)

- `pnpm install`: Installed dependencies and linked the new package.
- `pnpm -C packages/integration-tests test`: Verified the smoke test passes (3 tests).
- `pnpm -r test`: Verified all tests across the workspace pass.

## 13) Postflight Proof (recorded in commit message)

- `git status -sb`
- `git diff --stat`
- `pnpm -r test` output

## 14) Commit Proof (recorded in commit message)

- TBD

## 15) Amendments (append-only)
