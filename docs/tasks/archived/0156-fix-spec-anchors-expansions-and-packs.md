# Task 0156 — Fix Spec-Anchor Violations in `packages/expansion-*` and `@balance-control/packs`

Status: DONE

## Meta
- Owner: Codex
- Area: Rule traceability / expansions hygiene
- Packages: `packages/expansion-01`, `packages/expansion-02`, `packages/expansion-03`, `packages/packs` (or current pack entrypoint package)
- Skills: S01, S03, S04, S06, S08
- affected_guardrails: GR-002, GR-008, GR-012

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Replace `affected_guardrails: GR-TBD` above with the correct GR-xxx list (or `NONE`).
3. [x] Ensure Task 0154 is complete (the checker exists).
4. [x] Baseline:
   - `pnpm check:spec-anchors` (record output for Postflight).

## 1) Goal
Bring expansion packages and pack wrappers into compliance with canonical spec anchors:
- `@rule` tags and inline rule IDs must match `spec-anchors.generated.json` exactly.
- Expansion-scoped code must include `@expansion EXP-01|EXP-02|EXP-03` per ARCH-05.

## 2) Non-Goals
- No gameplay rule changes beyond correcting bindings.
- No repackaging / registry refactors.

## 3) Inputs
- `spec-anchors.generated.json`
- Expansion specs in `/docs/rules/001-expansion01.md`, `/docs/rules/002-expansion02.md`, `/docs/rules/003-expansion03.md`
- ARCH-05 documentation contract

## 4) Outputs
- Zero invalid anchor references in expansion packages and packs.
- TSDoc updated for touched exported symbols:
  - `@rule` (canonical), `@deterministic`, `@pure`/`@sideEffects`, `@expansion ...`.

## 5) Constraints
- Keep `@balance-control/game` decoupled from `@balance-control/expansion-*`.
- Deterministic ordering: no changes in registry order unless explicitly required (and then must be justified + tested).

## 6) Invariants
- Pack registration remains deterministic.
- No new cyclic dependencies.

## 7) Implementation Plan
1. Run `pnpm check:spec-anchors` and scope findings to:
   - `packages/expansion-*`
   - pack wrapper package (e.g. `packages/packs`)
2. For each invalid anchor:
   - Find the canonical spec anchor and replace exactly.
3. Audit expansion move resolvers / atoms / measure logic surfaces:
   - Ensure canonical `@rule` bindings.
   - Add `@expansion EXP-xx` where required.
4. Re-run `pnpm check:spec-anchors` until findings for the scoped packages are zero.
5. Run `pnpm test` (and any existing pack verification scripts).

## 8) Acceptance Criteria
- `pnpm check:spec-anchors` has zero findings for `packages/expansion-*` and packs package.
- Tests pass.
- No new dependency edges from `@balance-control/game` to `@balance-control/expansion-*`.

## 9) PR Checklist (must complete in-task)
- [x] Updated this task file in `docs/tasks/` and checked boxes.
- [x] Guardrails listed accurately (GR-xxx or `NONE`).
- [x] Exactly one commit with correct message format.
- [x] Postflight appended to commit message (git status/diff/tests).
- [x] No dirty working tree after postflight amend.

## 10) Notes
- If expansions legitimately reference CORE anchors, that is fine; they still must be canonical.
- If any anchor is missing from the generated list but present in markdown, treat as tooling inconsistency and STOP (DD doc).
