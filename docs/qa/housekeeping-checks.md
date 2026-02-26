# Housekeeping Checks (`pnpm run check:housekeeping`)

The check run ensures documentary repository hygiene and complements the existing `verify:docs` checks.

## What is checked automatically

1. **Root documents via whitelist**

   * At the repository root (`./`), only the following Markdown files are allowed:

     * `README.md`
     * `AGENTS.md`
   * Additional root-level Markdown files fail the check so that canonical documents are not diluted by duplicates outside of `/docs`.

2. **Canonical changelog path**

   * `docs/changelog.md` must exist.
   * A legacy path such as `CHANGELOG.md` at the root is forbidden.

3. **New task files without legacy changelog paths**

   * New `docs/tasks/*.md` (from task ID 0302 onward, and additionally via Git diff against `main/master` if available) must not use outdated paths such as `CHANGELOG.md`.
   * Only `docs/changelog.md` is permitted.

## Limits (intentionally not automated)

* The check does **not** evaluate the substantive correctness of changelog contents (paths/structure only).
* Historical, archived tasks are not rewritten retroactively.
* Semantic quality criteria for task texts (completeness, traceability of content) remain part of review and governance.
