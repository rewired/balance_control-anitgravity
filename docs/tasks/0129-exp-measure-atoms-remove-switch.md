# Task 0129 — EXP-01..03 measures: remove switch-based dispatch (map + per-measure handlers) + minimal pack-local tests

**Date:** 2026-02-19
**Owner:** Codex
**Branch:** `task/0129-exp-measure-atoms-remove-switch`

---

**Task State:** DRAFT

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
  - GR-009 State shape discipline
- Follow `AGENTS.md` (single-commit discipline, proof requirements, no drift).

## 1) Primary Spec Anchors (MUST)

- `docs/architecture/ARCH-03-MEASURE-CPU.md`
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
- Prior routing hook context:
  - `docs/tasks/0120-measure-dispatch-expansion-scoped-api.md`
  - `docs/tasks/0121-exp01-measure-object-id-prefix-standardization.md`
- Expansion engines (current state):
  - `packages/expansion-01/src/engine/index.ts`
  - `packages/expansion-02/src/engine/index.ts`
  - `packages/expansion-03/src/engine/index.ts`

## 2) Context

EXP-01..03 currently implement `getMeasureAtoms()` with large `switch(measureId)` blocks. This is:

- hard to audit
- hard to split into measure modules
- error-prone when adding/removing measures

This task converts measure dispatch to a declarative map of handlers (one function per measure, with alias support), without changing measure semantics.

Additionally, pack-local tests should assert that the dispatch map covers all declared measure IDs.

## 3) Goal

- For each expansion package (01/02/03), replace `switch(measureId)` with:
  - a `MEASURE_ATOM_BUILDERS` map (or equivalent) keyed by measureId
  - a thin `getMeasureAtoms()` that looks up and invokes the handler

- Add/extend minimal pack-local tests that verify:
  - every measureId in the declared measure list has a corresponding handler
  - unknown measureId returns `null`

## 4) Non-Goals

- Do not redesign measure rules or costs.
- Do not change how measure objects are created or how decks/zones are initialized.
- Do not introduce a JSON interpreter for measures yet (that is a later packet).

## 5) Inputs

- Existing expansion engine implementations in `packages/expansion-01..03/src/engine/index.ts`.
- Existing pack-local tests for EXP-02/03.

## 6) Outputs

- EXP-01..03 engine code updated so:
  - no `switch(measureId)` remains in `getMeasureAtoms()`
  - per-measure handlers exist (either inline map or separate `engine/measures/*.ts` modules)

- Pack-local tests:
  - EXP-02: extend `test/pack-integrity.test.ts` with dispatch coverage assertions
  - EXP-03: extend existing pack test similarly
  - EXP-01: add a new `test/pack-integrity.test.ts` (and add `test` script to package.json if missing)

## 7) Constraints (Hard)

- No behavior changes in produced atoms for any existing measureId.
- Deterministic behavior preserved.
- Keep changes minimal; avoid refactors unrelated to measure dispatch.

## 8) Implementation Plan

For each expansion package:

1. Define a `MEASURE_IDS` export (or keep existing constant, but tests must be able to reference it).

2. Define a map of handlers, for example:

   - `const MEASURE_ATOM_BUILDERS: Record<string, (G: GameState, payload: any) => any[] | null> = { ... }`.

   Notes:
   - If current switch uses shared logic across multiple measures (e.g. `case 'M03': case 'M04':`), implement that as:
     - one shared handler function and assign it to both keys, OR
     - one canonical key plus alias mapping.

3. Implement `getMeasureAtoms(G, measureId, payload)` as:
   - lookup `MEASURE_ATOM_BUILDERS[measureId]`
   - return `null` if missing
   - otherwise invoke and return handler result

4. Tests:
   - Add a test that asserts `MEASURE_IDS.every(id => typeof MEASURE_ATOM_BUILDERS[id] === 'function')`.
   - Add a test that asserts `getMeasureAtoms(..., 'UNKNOWN', ...) === null`.

5. Ensure `pnpm -r test` is green.

## 9) Acceptance Criteria

- [ ] EXP-01..03 `getMeasureAtoms()` contain no `switch` on `measureId`.
- [ ] Dispatch handlers cover 100% of declared `MEASURE_IDS` in each expansion.
- [ ] Pack-local tests exist for EXP-01 and cover measure dispatch mapping.
- [ ] `pnpm -r test` is green.
- [ ] `pnpm run verify:task 0129` passes.

## 10) PR Checklist (Repo Artifact)

- [ ] Task State progressed correctly (DRAFT→FROZEN before edits; DONE only at end).
- [ ] Single commit on the task branch.
- [ ] `pnpm -r test` executed; results recorded in Section 12.
- [ ] No unrelated formatting churn.
- [ ] Postflight proof captured (per AGENTS) and included in commit message.

## 11) Work Summary (3–7 bullets)

- 

## 12) Commands Run (with outcomes)

- 

## 13) Postflight Proof (recorded in commit message)

- `git status -sb`
- `git diff --stat`
- `pnpm -r test`

## 14) Commit Proof (recorded in commit message)

- `git show -1 --stat`

## 15) Amendments (append-only)
