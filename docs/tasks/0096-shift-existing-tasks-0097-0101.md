# Codex Task 0096 - Insert Pack-System Tasks: Renumber Existing 0097-0101

**Date:** 2026-02-17
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

---

## Goal

We must insert new tasks between **0095** and the currently planned **0097-0101** series.

This task shifts the *existing* task files currently numbered **0097–0101** to the back so that new Pack-System tasks can occupy **0097–0101**.

---

## Inputs

- Repository has existing task files in: `/docs/tasks/`
- Existing tasks include IDs **0097, 0098, 0099, 0100, 0101** (exact filenames may differ, but follow repo convention: `<task_id>-<meaningful_name>.md`)

---

## Outputs

### A) Renumber (git mv) task files

Shift by **+5**:

- 0097 -> 0102
- 0098 -> 0103
- 0099 -> 0104
- 0100 -> 0105
- 0101 -> 0106

Rules:
- Preserve the `-<meaningful_name>` part exactly.
- Use `git mv` so history follows the files.

### B) Update task references across repo

Search and update any references to the old IDs in:
- `/docs/` (including `CHANGELOG.md`, `AGENTS.md`, any roadmap/task index docs)
- source comments that reference task IDs

Replace old IDs with new ones consistently.

### C) Add an audit note

Create/append a short entry in a central place that future humans will actually see (choose one that exists in repo; prefer `CHANGELOG.md` or a `docs/tasks/README.md` if present):

- state that tasks 0097-0101 were renumbered to 0102-0106 to make room for Pack-System insertion
- include the mapping list above

---

## Constraints

- Do not change the content of the shifted task documents, except for fixing self-references to their task IDs if they contain them.
- Keep filenames strictly in `/docs/tasks/` and strictly in the `<task_id>-<meaningful_name>.md` convention.
- UTF-8, no BOM, no trailing whitespace.

---

## Invariants

- No two files in `/docs/tasks/` share the same numeric task ID prefix after the rename.
- All internal references to the moved tasks point to the new IDs.

---

## Acceptance Criteria

- `git status` shows only renames + reference updates (no accidental edits elsewhere).
- A quick `rg "0097|0098|0099|0100|0101" docs` returns only the new Pack-System tasks (after they are added) and no stale references to the shifted tasks.
- The task directory contains: `0102-*`, `0103-*`, `0104-*`, `0105-*`, `0106-*` for the previously existing tasks.

---

## PR Checklist

- [x] Renames done via `git mv`
- [x] References updated repo-wide
- [x] No duplicate task IDs in `/docs/tasks/`
- [x] Files are UTF-8 (no BOM) and lint-clean
- [x] Meaningful commit message, e.g. `tasks: renumber 0097-0101 to 0102-0106 to insert pack-system series`

---

## 15) Execution Log (append-only)

### affected_guardrails

- NONE

### spec_anchor_refs

- docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json

### Work Summary

- Renamed tasks 0097-0101 to 0102-0106 and updated self-references.
- Updated the changelog with a renumbering audit note.
- pnpm -r build failed in packages/bot-llm with TS2742 (pre-existing).

### Commands Run

- `git mv -v "docs/tasks/0097-documentation-contract.md" "docs/tasks/0102-documentation-contract.md"`
- `git mv -v "docs/tasks/0098-engine-core-tsdoc-pass.md" "docs/tasks/0103-engine-core-tsdoc-pass.md"`
- `git mv -v "docs/tasks/0099-expansion-annotation-pass.md" "docs/tasks/0104-expansion-annotation-pass.md"`
- `git mv -v "docs/tasks/0100-client-boundary-documentation.md" "docs/tasks/0105-client-boundary-documentation.md"`
- `git mv -v "docs/tasks/0101-determinism-annotation-guard.md" "docs/tasks/0106-determinism-annotation-guard.md"`
- `$env:NO_COLOR=1; pnpm lint` (pass, TS version warning only)
- `$env:NO_COLOR=1; pnpm -r build` (fail: bot-llm TS2742 createBotGame inferred type)
- `$env:NO_COLOR=1; pnpm test` (pass)
- `git status -sb`
- `git diff --stat`
- `git diff --stat docs/changelog.md`
