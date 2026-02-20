# S08 — PR Hygiene & Proof Protocol

## Purpose
Keep tasks mergeable and reviewable: clean diffs, reproducible commands, and proof that nothing accidental leaked in.

## Use when
- Every task packet execution

## Output
- One coherent commit (unless the task explicitly requires more)
- Proof snippets inside the task file:
  - commands run
  - key outputs
  - final `git status -sb`

## Steps
1. **Before changes**
   - `git status -sb` (capture in task notes)
2. **During work**
   - Keep changes scoped; avoid drive-by refactors.
3. **Before commit**
   - format + lint + tests (whatever the repo contract requires)
4. **Commit**
   - Message references task id.
5. **After commit**
   - `git status -sb` must be clean.

## Guardrails
- No unrelated changes.
- If you must touch a file outside scope, document the reason and keep it minimal.
