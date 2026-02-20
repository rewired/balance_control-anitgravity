# Task 0162 — PG-1: Structural prevention of commit shortcuts (lint + boundary tests)

Status: DRAFT

## Meta
- Owner: Codex
- Area: UI interaction safety rails
- Packages: repo root tooling + `packages/client-web`
- Skills: S05 (Boundary Check), S04 (Determinism Guard)
- affected_guardrails: GR-002, GR-005, GR-006

## 0) Preflight (mandatory)
1. [ ] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [ ] Confirm Tasks 0158–0161 are merged (single commit path + dock confirm + state machine).
3. [ ] Baseline scan (no edits yet):
   - `rg -n "ui/interaction/dispatchIntent" packages/client-web/src`
   - `rg -n "\bmoves\." packages/client-web/src`
   - `pnpm lint` and `pnpm -C packages/client-web test` (record outcomes for Postflight)

## 1) Goal
Prevent regressions where a component re-introduces a direct commit path.

After this task, the repo must **fail CI locally** if any of the following happens:
- A UI component imports the low-level `dispatchIntent` helper directly.
- Any file other than the controller (and the GameLayout wiring that constructs it) calls `moves.<moveType>(...)`.

## 2) Inputs
- Root ESLint config:
  - `.eslintrc.cjs`
- Client-web source tree:
  - `packages/client-web/src/**`
- Existing boundary test style:
  - `packages/client-web/test/no-game-src-imports.test.ts`

## 3) Outputs
### 3.1 Tooling / lint
- Update `.eslintrc.cjs` with overrides for `packages/client-web/src/**/*.{ts,tsx}`:
  - Add `no-restricted-imports` rules that forbid importing `**/ui/interaction/dispatchIntent`.
  - Provide a clear error message: “Do not import dispatchIntent; use controller.confirmDraft().”
  - Add a narrow override that ALLOWS this import only for:
    - `packages/client-web/src/ui/interaction/useGameInteractionController.ts`

### 3.2 Boundary tests (deterministic)
- Add a node-environment test in `packages/client-web/test/` that scans `packages/client-web/src` and fails if:
  1) `dispatchIntent` is imported outside the controller file.
  2) `moves.` is used outside the allowlisted wiring files (at minimum: `GameLayout.tsx` and `useGameInteractionController.ts`).
- The test output must be stable and sorted (file path order).

### 3.3 Files touched
- `.eslintrc.cjs`
- `packages/client-web/test/no-direct-commit-shortcuts.test.ts` (new)

## 4) Constraints
- No new heavy dependencies; reuse Node built-ins and existing test harness.
- Deterministic failure output ordering.
- Do not weaken existing boundaries (e.g., keep the no `/game/src/` import test intact).

## 5) Acceptance Criteria
- [ ] `pnpm lint` fails if a component imports `dispatchIntent` directly.
- [ ] `pnpm -C packages/client-web test` fails if a component calls `moves.<...>(...)` directly.
- [ ] `pnpm lint` and `pnpm -C packages/client-web test` pass on a clean tree.

## 6) PR Checklist
- [ ] Guardrails listed accurately (GR-002/005/006).
- [ ] No engine/rule/spec changes.
- [ ] Stable, deterministic boundary test.
- [ ] `pnpm lint` passes.
- [ ] `pnpm -C packages/client-web test` passes.
