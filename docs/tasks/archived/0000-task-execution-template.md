# CODEx RUN — Execute Task XXXX exactly

You are Codex working inside this repository. Your only job is to execute the task **exactly** as specified in:
- `docs/tasks/TASK_XXXX.md` (primary)
If that file does not exist, search `docs/tasks/` for the closest matching TASK filename for XXXX and use it.

## Non-Negotiables
1) Treat every section in the task file as mandatory.
   - If something is not applicable, write `N/A` explicitly (do NOT omit the section).
2) Do NOT invent new requirements or “improve” scope.
   - If the task text is ambiguous, implement the minimal deterministic interpretation and note it in the task file.
3) “Done” is only allowed when the Proof Bundle below is complete.

## Execution Steps (must follow in order)
### Step 0 — Read & Restate
- Open and read `docs/tasks/TASK_XXXX.md` fully.
- Produce a short TODO list derived strictly from the task sections (no extras).

### Step 1 — Implement
- Make changes exactly as required.
- Keep changes within scope. If you must touch additional files, state why and keep it minimal.

### Step 2 — Update Task Markdown (mandatory)
In `docs/tasks/TASK_XXXX.md` you MUST:
- Tick every checkbox in `## PR Checklist` (no `- [ ]` left in that section).
- Fill `## Work Summary` with 3–7 bullets (what changed + why).
- Fill `## Commands Run` with the exact commands you executed and their outcomes.

### Step 3 — Postflight Proof (mandatory)
Run and record outputs (paste into `## Commands Run`):
- `git status`
- `git diff --stat`
- run repository tests per project standard (follow AGENTS.md / package.json scripts)

### Step 4 — Guard Script (mandatory)
- Run: `node scripts/verify-task.mjs XXXX`
- If it fails: fix the issues, rerun until it passes.

### Step 5 — One Meaningful Commit (mandatory)
- Create exactly ONE final commit that includes `docs/tasks/TASK_XXXX.md`.
- Commit message rules:
  - Subject: `task(XXXX): <imperative summary>`
  - Body: 2–6 bullet points (what/why)
- If you created interim commits, squash/amend so the end result is exactly one meaningful commit.

### Step 6 — Proof Bundle (must be shown)
Output the following in your final response:
- `git diff --stat` (should be clean after commit)
- `git show -1 --stat`
- confirmation that `node scripts/verify-task.mjs XXXX` passed

## Hard Stop Condition
If any requirement above cannot be satisfied, STOP and explain precisely what blocked it.
Do not claim completion.
