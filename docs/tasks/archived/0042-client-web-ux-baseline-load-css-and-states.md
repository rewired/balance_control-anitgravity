# Codex Task 0042 - Client-Web UX Baseline: Load CSS + Visual States + Resource Palette

**Date:** 2026-02-14
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Determinism (engine): AGENTS 0.2
- Client is presentation only: ARCH-01, AGENTS 1.5
- No rules drift: AGENTS 0.1, 0.5, 0.6
- UTF-8 hygiene: .editorconfig, Task 0001

---

## Goal

Fix the current "unstyled / unclear interaction" baseline so the UI becomes readable and self-explanatory:

- global CSS actually loads
- tile/token states are visible (selected / disabled / clickable)
- resource colors cover all known resource types (core + expansions), even if expansions are off

No gameplay changes. No rules logic in the client.

---

## Inputs

- `packages/client-web/src/main.tsx` (currently does not import `index.css`)
- `packages/client-web/src/index.css` (missing tile state styles; partial token palette)
- `packages/client-web/src/components/Tile.tsx`
- `packages/client-web/src/components/Token.tsx`

---

## Outputs

### A) Ensure global CSS is loaded

- In `packages/client-web/src/main.tsx`, import `./index.css` (top-level).

### B) Make tile states explicit in CSS

Update `packages/client-web/src/index.css`:

- Add styles for:
  - `.tile-selected` (clear outline/glow; must be obvious at a glance)
  - `.tile-disabled` (reduced opacity; cursor not-allowed; no hover lift)
  - `.tile-clickable` (cursor pointer; hover lift allowed)
- Remove the implicit `cursor: pointer` from `.tile` base; apply cursor only via `.tile-clickable`.

### C) Complete resource token palette

Update `packages/client-web/src/index.css`:

- Add resource classes for all known types:
  - `DOM`, `FOR`, `INF`, `ECO`, `SEC`, `CLM`
- Keep class naming consistent with `Token.tsx`:
  - `.token.resource-dom`, `.token.resource-for`, ...
- Add (or reuse) CSS variables for missing accents (for example `--accent-inf`, `--accent-sec`, `--accent-clm`).

Note: This is purely visual; it must not depend on expansion enablement.

### D) Harden Token class generation

Update `packages/client-web/src/components/Token.tsx`:

- Ensure `resort` class generation is robust (lowercase, safe for string resorts).
- Add a fallback class for unknown resorts (for example `resource-unknown`) so the token remains visible.

### E) Add focused client-web tests

Add/extend vitest tests under `packages/client-web/test`:

- Tile:
  - `selected=true` adds `tile-selected`
  - `disabled=true` adds `tile-disabled`
  - `tile-clickable` only when `onClick` is provided and `disabled=false`
- Token:
  - Resource `INF` results in class `resource-inf` (and similarly `SEC` and `CLM`)
  - Unknown resort uses `resource-unknown`

### F) Bookkeeping (required by repo guardrails)

- Add this file: `docs/tasks/0042-client-web-ux-baseline-load-css-and-states.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0042)
- Update `CHANGELOG.md` under "Unreleased":
  - Client: load global styles, tile state visuals, and full resource palette.

---

## Constraints

- No move legality logic in client. Visual-only changes.
- No time-based UI behavior for correctness (no `setTimeout` hacks).
- Keep identifiers and markdown ASCII-only (avoid encoding drift).

---

## Invariants

- Engine remains authority. UI states are derived from props/intents only.
- No changes to rules packages.

---

## Acceptance Criteria

1. `pnpm -C packages/client-web dev` shows styled UI (not unstyled default DOM).
2. Selected tiles are visually obvious; disabled tiles do not look clickable.
3. Resource tokens have distinct colors for `DOM/FOR/INF/ECO/SEC/CLM`.
4. `pnpm -w test` is green.

---

## PR Checklist

- [x] Import `index.css` in `client-web` `main.tsx`
- [x] Add tile state styles (selected/disabled/clickable) + correct cursor/hover behavior
- [x] Add token palette for `DOM/FOR/INF/ECO/SEC/CLM` + fallback `resource-unknown`
- [x] Add/extend `client-web` tests for Tile + Token class behavior
- [x] Update `docs/PR_TASK_LIST.md`
- [x] Update `CHANGELOG.md` (Unreleased)
- [x] CI green

---

## Work Summary

- Imported global client-web styles to ensure consistent baseline UI.
- Added explicit tile state styling for selected/disabled/clickable affordances.
- Expanded resource token palette with INF/SEC/CLM and unknown fallback colors.
- Hardened resource resort class generation for consistent token styling.
- Added Tile/Token tests for state classes and resource class coverage.
- Updated PR task list and changelog for Task 0042.

---

## Commands Run

- `git status -sb`
  ```text
   M CHANGELOG.md
   M docs/PR_TASK_LIST.md
   M packages/client-web/src/components/Token.tsx
   M packages/client-web/src/index.css
   M packages/client-web/src/main.tsx
   M packages/client-web/test/Board.test.tsx
  ```
- `git diff --stat`
  ```text
  warning: in the working copy of 'packages/client-web/test/Board.test.tsx', CRLF will be replaced by LF the next time Git touches it
   CHANGELOG.md                                 |  1 +
   docs/PR_TASK_LIST.md                         |  1 +
   packages/client-web/src/components/Token.tsx |  8 ++-
   packages/client-web/src/index.css            | 46 ++++++++++++++-
   packages/client-web/src/main.tsx             |  1 +
   packages/client-web/test/Board.test.tsx      | 87 +++++++++++++++++++++-------
   6 files changed, 119 insertions(+), 25 deletions(-)
  ```
- `pnpm lint`
  ```text
  > balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
  > eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"

  =============

  WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.

  You may find that it works just fine, or you may not.

  SUPPORTED TYPESCRIPT VERSIONS: >=4.7.4 <5.6.0

  YOUR TYPESCRIPT VERSION: 5.9.3

  Please only submit bug reports when using the officially supported version.

  =============
  ```
- `pnpm -w test`
  ```text

  > balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
  > pnpm -r --if-present test

  Scope: 9 of 10 workspace projects
  [56 lines collapsed]
  │ stdout | test/expansion.test.ts > Expansion System > should register an expansion
  │ Expansion registered: TestExp
  │ stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
  │ Expansion registered: ModExp
  │  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
  │  ✓ test/player-view.test.ts  (2 tests) 4ms
  │  Test Files  22 passed (22)
  │       Tests  84 passed (84)
  │    Start at  20:31:12
  │    Duration  28.33s (transform 4.99s, setup 3ms, collect 47.58s, tests 1.86s, environment 4ms, prepare 57.30s)
  └─ Done in 30.7s
  packages/client-web test$ vitest run
  │  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
  │  ✓ test/Board.test.tsx  (6 tests) 26ms
  │  ✓ test/controls-start-committee.test.tsx  (1 test) 21ms
  │  Test Files  2 passed (2)
  │       Tests  7 passed (7)
  │    Start at  20:31:43
  │    Duration  22.20s (transform 131ms, setup 0ms, collect 3.99s, tests 47ms, environment 12.77s, prepare 1.48s)
  └─ Done in 24.7s
  ```
- `node scripts/verify-task.mjs 0042`
  ```text
  [verify-task] FAIL: PR Checklist has 7 unchecked item(s). Example:
  - [ ]
  - [ ]
  - [ ]
  - [ ]
  - [ ]
  ```
- `git status -sb`
  ```text
   M CHANGELOG.md
   M docs/PR_TASK_LIST.md
   M docs/tasks/0042-client-web-ux-baseline-load-css-and-states.md
   M packages/client-web/src/components/Token.tsx
   M packages/client-web/src/index.css
   M packages/client-web/src/main.tsx
   M packages/client-web/test/Board.test.tsx
  ```
- `git diff --stat`
  ```text
  warning: in the working copy of 'packages/client-web/test/Board.test.tsx', CRLF will be replaced by LF the next time Git touches it
   CHANGELOG.md                                       |  1 +
   docs/PR_TASK_LIST.md                               |  1 +
   ...2-client-web-ux-baseline-load-css-and-states.md | 99 ++++++++++++++++++++--
   packages/client-web/src/components/Token.tsx       |  8 +-
   packages/client-web/src/index.css                  | 46 +++++++++-
   packages/client-web/src/main.tsx                   |  1 +
   packages/client-web/test/Board.test.tsx            | 87 ++++++++++++++-----
   7 files changed, 209 insertions(+), 34 deletions(-)
  ```
- `git checkout -b task/0042-client-web-ux-baseline`
  ```text
  ```
- `git add -A`
  ```text
  warning: in the working copy of 'packages/client-web/test/Board.test.tsx', CRLF will be replaced by LF the next time Git touches it
  ```
- `git commit -m "task(0042): improve client-web baseline visuals" -m "- import global styles and add tile state styling" -m "- expand resource palette and harden token class fallback" -m "- add tile/token class tests and update task docs"`
  ```text
   and update task docs"'
  error: unexpected argument 'improve' found

  Usage: trae-sandbox.exe exec [OPTIONS] --storage-path <STORAGE_PATH> --config-name <CONFIG_NAME> --shell-path <SHELL_PATH> --command-line <COMMAND_LINE>

  For more information, try '--help'.
  ```
- `git commit -m 'task(0042): improve client-web baseline visuals' -m '- import global styles and add tile state styling' -m '- expand resource palette and harden token class fallback' -m '- add tile/token class tests and update task docs'`
  ```text
  s tests and update task docs'''
  [task/0042-client-web-ux-baseline 4e17e94] task(0042): improve client-web baseline visuals
   7 files changed, 233 insertions(+), 36 deletions(-)
  ```
- `node scripts/verify-task.mjs 0042`
  ```text
  [verify-task] OK: Section "Work Summary" present.
  [verify-task] OK: Section "Commands Run" present.
  [verify-task] OK: Latest commit format + task file inclusion OK (task(0042): improve client-web baseline visuals).

  [verify-task] PASS ✅
  ```
- `git add -A`
  ```text
  ```
- `git commit --amend --no-edit`
  ```text
   Date: Sat Feb 14 22:23:39 2026 +0100
   7 files changed, 263 insertions(+), 36 deletions(-)
  ```
