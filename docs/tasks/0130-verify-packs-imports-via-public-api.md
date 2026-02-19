# Task 0130 — scripts/verify-packs: stop importing from dist file paths (use @balance-control/game public API)

**Date:** 2026-02-19
**Owner:** Codex
**Branch:** `task/0130-verify-packs-imports-via-public-api`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

- **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
- **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
- During **IMPLEMENTING/VERIFYING:** you may only:
  - check boxes in **Section 10**
  - fill **Sections 11–14** (Work Summary / Commands / Proof)
- If scope changes beyond small clarifications, stop and create a follow-up task.

## 0) Masterplan Guardrails (MUST)

- Follow `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
  - GR-003 Determinism
  - GR-012 Config is canonical
- Follow `AGENTS.md` (single-commit discipline, proof requirements, no drift).

## 1) Primary Spec Anchors (MUST)

- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (pack registry is canonical)
- `packages/game/src/expansion-registry.ts` (canonical module order)
- `scripts/verify-packs.mjs` (target script)

## 2) Context

`scripts/verify-packs.mjs` currently imports JS bundles by **file path** under `packages/game/dist/*` and pulls `CorePack`/`ExpXXPack` from that dist build. This is brittle and makes future pack extraction harder.

We want `verify:packs` to load the engine via the package entrypoint (workspace resolution), and to only depend on **public exports** of `@balance-control/game`.

## 3) Goal

- Make `scripts/verify-packs.mjs` import everything it needs from `@balance-control/game` (package import), not by file paths into `dist/`.
- Export whatever is missing from `packages/game/src/index.ts` so the script does not need private module imports.

## 4) Non-Goals

- Do not change pack semantics or registry behavior.
- Do not remove `CorePack` / `Exp01Pack` / `Exp02Pack` / `Exp03Pack` exports yet.
- Do not redesign `verify:packs` into a full test suite.

## 5) Inputs

- Existing `scripts/verify-packs.mjs`.
- `packages/game/src/index.ts` (export surface).
- `packages/game/src/move-assembly.ts` and `packages/game/src/expansion-registry.ts` (currently imported indirectly via dist paths).

## 6) Outputs

- `scripts/verify-packs.mjs` updated to:
  - `import { ... } from '@balance-control/game'`
  - provide a clear failure message if packages are not built (e.g. instruct `pnpm -r build`)

- `@balance-control/game` exports updated so `verify-packs` can access:
  - `assemblePacks`
  - `CANONICAL_ENGINE_MODULE_ORDER`

## 7) Constraints (Hard)

- `pnpm run verify:packs` must continue to work in the same environments as today.
- Keep the script deterministic and side-effect free (except console output).
- Avoid adding new dependencies.

## 8) Implementation Plan

1. Update `packages/game/src/index.ts` to export:
   - `assemblePacks` (already imported internally)
   - `CANONICAL_ENGINE_MODULE_ORDER` from `./expansion-registry`

2. Update `scripts/verify-packs.mjs`:
   - replace the current file-path dist imports with a package import from `@balance-control/game`
   - remove `assertFile()` checks for individual dist files
   - if importing fails due to missing build artifacts, print a clear instruction and exit non-zero

3. Run:
   - `pnpm -r build`
   - `pnpm run verify:packs`
   - `pnpm -r test`

## 9) Acceptance Criteria

- [x] `scripts/verify-packs.mjs` no longer imports from `packages/game/dist/*` via file paths.
- [x] `@balance-control/game` publicly exports `assemblePacks` and `CANONICAL_ENGINE_MODULE_ORDER`.
- [x] `pnpm run verify:packs` passes (after `pnpm -r build`).
- [x] `pnpm -r test` is green.
- [x] `pnpm run verify:task 0130` passes.

## 10) PR Checklist (Repo Artifact)

- [x] Task State progressed correctly (DRAFT→FROZEN before edits; DONE only at end).
- [x] Single commit on the task branch.
- [x] `pnpm -r test` executed; results recorded in Section 12.
- [x] No unrelated formatting churn.
- [x] Postflight proof captured (per AGENTS) and included in commit message.

## 11) Work Summary (3–7 bullets)

- Updated `packages/game/src/index.ts` to export `assemblePacks` and `CANONICAL_ENGINE_MODULE_ORDER`.
- Added `@balance-control/game` as a devDependency in root `package.json` to allow package imports in scripts.
- Rewrote `scripts/verify-packs.mjs` to import from `@balance-control/game` instead of using file paths to `dist/`.
- Removed manual `assertFile` checks in favor of package import validation.
- Verified that `verify:packs` passes and tests are green.

## 12) Commands Run (with outcomes)

- `pnpm -r build` -> OK
- `pnpm run verify:packs` -> OK
- `pnpm -r test` -> OK (38 test files passed)

## 13) Postflight Proof (recorded in commit message)

- `git status -sb`
- `git diff --stat`
- `pnpm -r build`
- `pnpm run verify:packs`
- `pnpm -r test`

## 14) Commit Proof (recorded in commit message)

- `git show -1 --stat`

## 15) Amendments (append-only)
