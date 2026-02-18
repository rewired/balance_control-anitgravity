# Task 0123 — Add pack-local tests to expansion packages (EXP-02/EXP-03) to replace engine-coupled coverage

**Date:** 2026-02-18
**Owner:** Codex
**Branch:** `task/0123-add-pack-local-tests-for-expansion-02-03`

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
- `docs/tasks/0122-decouple-game-tests-from-expansion-packages.md` (context: coverage moves out of engine tests)

## 2) Context

After Task 0122, engine unit tests no longer import real expansion packages. Any pack-specific assertions that used to be validated indirectly from `packages/game/test/*` should live with the pack itself.

This task adds minimal **pack-local** test coverage for EXP-02 and EXP-03.

## 3) Goal

- Add `vitest` tests inside:
  - `packages/expansion-02/test/*`
  - `packages/expansion-03/test/*`
- Validate pack integrity at the pack boundary (not engine internals):
  - Pack can be imported via its engine entrypoint.
  - Pack definition validates (no duplicate module keys where applicable).
  - Measure deck definitions are internally consistent (IDs, objectId prefixes, etc.)

## 4) Non-Goals

- Do not add full scenario/integration gameplay tests (see Task 0124).
- Do not change pack content.
- Do not add UI tests.

## 5) Inputs

- `packages/expansion-02` and `packages/expansion-03` current engine entrypoints (e.g. `src/engine/*`, `src/index.ts`).
- Any existing pack validators/helpers available in `@balance-control/game` or `@balance-control/shared`.

## 6) Outputs

- New tests for EXP-02 and EXP-03 that:
  1. Import the expansion pack engine entrypoint.
  2. Assert the pack definition shape is valid (required fields present, IDs stable).
  3. Assert measure providers/objectId prefixes are namespaced and do not overlap.
  4. (If measures exist) assert measure IDs within the expansion are unique and deterministic.

- `package.json` updates in expansions if `test` script is missing:
  - `"test": "vitest run --no-threads --sequence.concurrent false"`

## 7) Constraints (Hard)

- Pack-local tests must not import `packages/game/src/*` via relative paths (only package imports).
- Avoid requiring a running server/client.
- Deterministic assertions only.

## 8) Implementation Plan

1. For each expansion (02 and 03):
   - Confirm there is a `test` script; add if missing.
   - Create `test/pack-integrity.test.ts`.
2. In each test file:
   - Import the pack definition from the package's engine entrypoint.
   - Assert stable `id`, `objectIdPrefixes` (if present), and measure-related invariants.
3. If the repo already has a pack validation helper (preferred), use it. Otherwise, implement a small local validator inside the test file.
4. Run `pnpm -C packages/expansion-02 test` and `pnpm -C packages/expansion-03 test`.

## 9) Acceptance Criteria

- [x] EXP-02 has at least one passing pack-integrity test.
- [x] EXP-03 has at least one passing pack-integrity test.
- [x] `pnpm -r test` remains green.
- [x] No expansion test imports engine source by relative path.

## 10) PR Checklist (Repo Artifact)

- [x] Task State progressed correctly (DRAFT→FROZEN before edits; DONE only at end).
- [x] Single commit on the task branch.
- [x] Expansion tests executed; results recorded in Section 12.
- [x] No unrelated formatting churn.
- [x] Postflight proof captured (per AGENTS) and included in commit message.

## 11) Work Summary (3–7 bullets)

- Added `test` script to `packages/expansion-02/package.json` and `packages/expansion-03/package.json`.
- Created `packages/expansion-02/test/pack-integrity.test.ts` to verify pack definition.
- Created `packages/expansion-03/test/pack-integrity.test.ts` to verify pack definition.
- Verified that both expansion packs have valid IDs, measure decks, and zones.
- Verified that tests pass with `pnpm -r test`.

## 12) Commands Run (with outcomes)

- `pnpm -C packages/expansion-02 test`: Passed (3 tests)
- `pnpm -C packages/expansion-03 test`: Passed (3 tests)
- `pnpm -r test`: All tests passed across 9 packages.

## 13) Postflight Proof (recorded in commit message)

- `git status -sb`
- `git diff --stat`
- `pnpm test` output

## 14) Commit Proof (recorded in commit message)

- `git show -1 --stat`

## 15) Amendments (append-only)
