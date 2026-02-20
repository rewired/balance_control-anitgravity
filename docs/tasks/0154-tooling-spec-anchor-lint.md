# Task 0154 — Add Spec-Anchor Lint (validate `@rule` + inline rule IDs) using `spec-anchors.generated.json`

Status: TODO

## Meta
- Owner: Codex
- Area: Tooling / Rule traceability
- Packages: repo root tooling + engine/expansion packages (read-only scan)
- Skills: S01, S03, S04, S08
- affected_guardrails: GR-TBD (MUST be replaced after reading `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`)

## 0) Preflight (mandatory)
1. Read `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`.
2. Replace `affected_guardrails: GR-TBD` above with the correct GR-xxx list (or `NONE`).
3. Locate `spec-anchors.generated.json` in-repo (do not assume path):
   - `git ls-files "*spec-anchors.generated.json"`
4. Baseline scan:
   - `rg -n "@rule\s+" packages`
   - `rg -n "//\s*(CORE|EXP)-\d\d-" packages`

## 1) Goal
Create a deterministic, CI-friendly checker that:
- Loads `spec-anchors.generated.json` as the canonical allowlist.
- Scans TypeScript sources for rule references in:
  - TSDoc tags: `@rule <RULE_ID>`
  - Inline comments: `// CORE-...` or `// EXP-...` (canonical anchor tokens)
- Fails with a stable, sorted error report if any referenced rule ID is not present in `spec-anchors.generated.json`.

## 2) Non-Goals
- No auto-fix in this task.
- No regeneration of the anchors JSON (use the existing artifact).

## 3) Inputs
- `spec-anchors.generated.json`
- Source code under `packages/**` (TypeScript)

## 4) Outputs
- New script (preferred): `scripts/check-spec-anchors.mjs` (or existing tooling directory convention).
- New `pnpm` script alias (preferred): `pnpm check:spec-anchors`.
- Optional: lightweight unit test for the checker (only if repo already has a test harness for scripts).

## 5) Constraints
- Deterministic output ordering (sort by file path, then line, then column).
- No new heavy dependencies. Prefer Node built-ins and existing deps.
- Must handle monorepo scale efficiently (single-pass per file; avoid quadratic scans).

## 6) Invariants
- Checker must not modify tracked files.
- Checker must not depend on network access or system time.

## 7) Implementation Plan
1. Inspect the schema of `spec-anchors.generated.json` and extract the canonical set of anchor strings.
2. Implement a file walker limited to TypeScript sources:
   - include: `**/*.ts`, `**/*.tsx`
   - exclude: `**/dist/**`, `**/build/**`, `**/.turbo/**`, `**/node_modules/**`
3. Extract rule references with conservative regexes:
   - `@rule\s+(CORE|EXP)-[0-9]{2}-[0-9]{2}-[0-9]{2}(?:\([a-z0-9]+\))*` (adjust only if spec uses different shape)
   - `//\s*((CORE|EXP)-...)`
   - IMPORTANT: do not “normalize” anchors; compare exact strings.
4. For each referenced anchor not in the allowlist:
   - Record a finding `{file, line, col, anchor, context}`.
5. Print findings deterministically and exit with non-zero code.
6. Add `pnpm check:spec-anchors` in the root `package.json`.

## 8) Acceptance Criteria
- Running `pnpm check:spec-anchors`:
  - exits `0` when no invalid anchors are present.
  - exits non-zero and prints a stable, readable report when invalid anchors exist.
- The checker uses `spec-anchors.generated.json` as the sole authority.

## 9) PR Checklist (must complete in-task)
- [ ] Updated this task file in `docs/tasks/` and checked boxes.
- [ ] Guardrails listed accurately (GR-xxx or `NONE`).
- [ ] Exactly one commit with correct message format.
- [ ] Postflight appended to commit message (git status/diff/tests).
- [ ] No dirty working tree after postflight amend.

## 10) Notes
- This task intentionally does not fix violations; that comes next.
