# Task 0155 — Fix Spec-Anchor Violations in `packages/game` (CORE engine)

Status: COMPLETED

## Meta
- Owner: Codex
- Area: Rule traceability / CORE engine hygiene
- Packages: `packages/game`
- Skills: S01, S03, S04, S05, S08
- affected_guardrails: GR-002, GR-003, GR-004, GR-007, GR-008, GR-011

## 0) Preflight (mandatory)
1. Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. Replace `affected_guardrails: GR-TBD` above with the correct GR-xxx list (or `NONE`).
3. Ensure Task 0154 is complete (the checker exists):
   - `pnpm check:spec-anchors` is available.
4. Run baseline:
   - `pnpm check:spec-anchors` (record output for Postflight; do not paste into files).
   - If the checker reports violations outside `packages/game`, do NOT fix them here; scope is `packages/game` only.

## 1) Goal
Make `packages/game` pass the spec-anchor checker by:
- Replacing non-canonical / outdated / invented rule IDs with canonical anchors present in the spec.
- Ensuring rule-resolving exported symbols in `packages/game` have TSDoc `@rule` tags per ARCH-05.

## 2) Non-Goals
- Do not change game behavior except where required to correct rule bindings.
- Do not touch expansion packages.
- Do not regenerate `spec-anchors.generated.json`.

## 3) Inputs
- `spec-anchors.generated.json`
- `ARCH-05-DOCUMENTATION-CONTRACT.md`
- `pnpm check:spec-anchors` output

## 4) Outputs
- Updated TSDoc / inline comments in `packages/game` such that:
  - every referenced anchor token is valid.
  - rule-resolving functions carry `@rule` tags.

## 5) Constraints
- Exact match required: do not “approximate” anchors.
- If a function has no direct spec binding, treat as infrastructure:
  - omit `@rule`
  - include `@remarks "infrastructure; no direct SPEC binding"`.

## 6) Invariants
- No change to deterministic ordering.
- No new engine↔expansion coupling.

## 7) Implementation Plan
1. Run `pnpm check:spec-anchors` and filter findings to `packages/game`.
2. For each finding:
   - Locate the correct anchor in `spec-anchors.generated.json` (and/or the corresponding spec MD file).
   - Replace the invalid anchor with the canonical one.
3. Audit high-value rule execution surfaces in `packages/game`:
   - move resolvers
   - `enumerateLegalIntents`
   - authoritative state mutators
   Ensure they have TSDoc with `@rule`, `@deterministic`, and `@pure`/`@sideEffects` as required.
4. Re-run `pnpm check:spec-anchors` until `packages/game` has zero findings.
5. Run `pnpm test`.

## 8) Acceptance Criteria
- `pnpm check:spec-anchors` reports no findings within `packages/game`.
- `pnpm test` passes.
- TSDoc tags comply with ARCH-05 minimum set on touched exported rule-resolvers.

## 9) PR Checklist (must complete in-task)
- [x] Updated this task file in `docs/tasks/` and checked boxes.
- [x] Guardrails listed accurately (GR-xxx or `NONE`).
- [x] Exactly one commit with correct message format.
- [x] Postflight appended to commit message (git status/diff/tests).
- [x] No dirty working tree after postflight amend.

## 10) Notes
- If you discover a genuine spec ambiguity (no matching anchor exists), STOP and create a DD doc per AGENTS 0.6.
