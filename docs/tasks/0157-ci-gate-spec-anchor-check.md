# Task 0157 — Gate CI on Spec-Anchor Compliance + Document Workflow

Status: DONE

## Meta
- Owner: Codex
- Area: CI / workflow hardening
- Packages: repo tooling + docs
- Skills: S01, S03, S08
- affected_guardrails: NONE

## 0) Preflight (mandatory)
1. [x] Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. [x] Replace `affected_guardrails: GR-TBD` above with the correct GR-xxx list (or `NONE`).
3. [x] Ensure Tasks 0154–0156 are complete or the repo is currently clean:
   - `pnpm check:spec-anchors` should pass locally.

## 1) Goal
Make spec-anchor compliance non-optional by:
- Adding `pnpm check:spec-anchors` to the standard verification surface (CI or `pnpm test` pipeline) without slowing down dev loops unnecessarily.
- Documenting the intended workflow: when spec changes, how to keep rule bindings and anchor checks correct.

## 2) Non-Goals
- Do not redesign the CI pipeline.
- Do not introduce heavy new tooling.

## 3) Inputs
- Existing CI config (GitHub Actions or equivalent)
- `pnpm check:spec-anchors`
- ARCH-05

## 4) Outputs
- CI (or equivalent required pipeline) runs `pnpm check:spec-anchors`.
- Documentation update in the repo describing:
  - What `spec-anchors.generated.json` is used for.
  - How to run the checker.
  - The expected fix workflow (update code bindings; never invent anchors).

## 5) Constraints
- Keep output readable and deterministic.
- Keep runtime reasonable (the checker should be fast; if slow, add path scoping or caching without compromising correctness).

## 6) Invariants
- No rule behavior changes.
- No dependency changes that re-couple `@balance-control/game` to expansions.

## 7) Implementation Plan
1. Add `pnpm check:spec-anchors` to the repo’s main verification entrypoint:
   - Prefer: CI job step right before tests.
   - Alternative: add to a `pnpm verify` script if that exists and is used in CI.
2. Update docs (choose the most appropriate location; do not invent new top-level docs unless needed):
   - Add a short section under AGENTS.md (rules traceability) OR
   - Add a short section under `/docs/architecture/ARCH-05-DOCUMENTATION-CONTRACT.md` (tooling note) OR
   - Add a `/docs/tooling/spec-anchors.md` if a tooling docs folder exists.
3. Re-run full pipeline locally (as available):
   - `pnpm check:spec-anchors`
   - `pnpm test`

## 8) Acceptance Criteria
- CI runs the checker.
- Local runs: `pnpm check:spec-anchors` + `pnpm test` pass.
- Docs clearly state: anchors are canonical; no invented rule IDs.

## 9) PR Checklist (must complete in-task)
- [x] Updated this task file in `docs/tasks/` and checked boxes.
- [x] Guardrails listed accurately (GR-xxx or `NONE`).
- [ ] Exactly one commit with correct message format.
- [ ] Postflight appended to commit message (git status/diff/tests).
- [ ] No dirty working tree after postflight amend.

## 10) Notes
- If CI is shared across many jobs, keep the checker in the earliest/cheapest job to fail fast.
