# Codex Task 0043 - Hex Board Rendering v1: Spatial Layout for Tiles + Ghost Targets

**Date:** 2026-02-14
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Determinism (engine): AGENTS 0.2
- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5
- Hex topology contract: AGENTS 1.4

---

## Goal

Replace the current "flex-wrapped list of coords" with a real spatial hex board:

- tiles and ghost placement targets appear at their axial (q,r) positions
- clicking a ghost places the staged tile (by dispatching the existing legal intent payload)
- deterministic rendering order is preserved

No new rules. No new move logic.

---

## Inputs

- `packages/client-web/src/components/BoardGrid.tsx` (current non-spatial rendering)
- Legal intents already exist and include `placeTile` with `payload.targetCoord`
- `G.grid` keys are `"q,r"` axial coords (string)

---

## Outputs

### A) Add pure layout helper (no React, no DOM)

Add: `packages/client-web/src/ui/hexLayout.ts`

- `parseCoordString("q,r") -> { q: number, r: number }`
- `axialToPixel({ q, r }, hexSize) -> { x: number, y: number }`
- `computeBounds(coords, hexSize) -> { minX, minY, maxX, maxY }`
- `stableSortCoords(coordStrings) -> string[]` (lexicographic)

Pick one orientation (pointy-top OR flat-top) and document the formula in comments. Be consistent everywhere.

### B) Add a spatial board component

Add: `packages/client-web/src/components/HexBoard.tsx`

Responsibilities:

- Render occupied tiles at computed pixel positions.
- Render ghost targets at computed pixel positions (same coordinate space).
- Deterministic ordering:
  - occupied coords sorted lexicographically
  - ghost coords sorted lexicographically
- Provide test ids:
  - `data-testid="hex-tile-q_r"` and `data-testid="hex-ghost-q_r"` (underscore, not comma)

Implementation notes:

- Use absolute positioning inside a relative container.
- Reuse existing `Tile` component for occupied cells.
- Ghosts are buttons (or divs) with clear affordance; clicking dispatches exactly one move call.

### C) Wire into layout

Update `packages/client-web/src/components/GameLayout.tsx`:

- Replace `BoardGrid` usage with `HexBoard` (keep props as needed: `G`, `moves`, `intents`, selection callback).

### D) CSS for spatial board

Update `packages/client-web/src/index.css`:

- Add `.hex-board`, `.hex-layer`, `.hex-cell` styles.
- Ghosts must look like valid placement targets (outlined shape, hover glow).
- Keep it minimal and readable.

### E) Tests

Add tests (no DOM measurement needed):

- Unit tests for `hexLayout.ts`:
  - `axialToPixel` deterministic for known coords
  - `computeBounds` returns expected min/max for a small coord set
- One RTL test:
  - renders a ghost with `data-testid="hex-ghost-q_r"`
  - clicking it calls the provided move dispatcher with the exact payload

### F) Bookkeeping

- Add this file: `docs/tasks/0043-hex-board-rendering-v1-spatial-layout.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0043)
- Update `CHANGELOG.md` (Unreleased):
  - Client: spatial hex board rendering for tiles + placement ghosts.

---

## Constraints

- Do NOT recompute legal placement targets in the client. Only render those provided via legal intents.
- Keep layout helper pure (no `window`, no `Date`, no randomness).
- No new dependencies in this task.

---

## Invariants

- UI renders from `G.grid` + `intents` only.
- Clicking a ghost dispatches exactly one `moves.placeTile(payload)`.

---

## Acceptance Criteria

1. In dev, the board looks like a board: tiles occupy stable positions; ghosts surround the cluster.
2. Clicking a ghost places the staged tile at that coord.
3. `pnpm -w test` is green.

---

## PR Checklist

- [x] Add `ui/hexLayout.ts` (pure + tested)
- [x] Add `HexBoard` component rendering tiles + ghosts spatially
- [x] Wire `HexBoard` into `GameLayout`
- [x] Add CSS for spatial board + ghost affordance
- [x] Add tests (layout unit + minimal RTL click)
- [x] Update `docs/PR_TASK_LIST.md`
- [x] Update `CHANGELOG.md` (Unreleased)
- [x] CI green

---

## Work Summary

- Added axial layout helpers for parsing coords, pixel positions, and bounds to keep rendering deterministic.
- Replaced the grid list with a spatial HexBoard that positions tiles and ghost targets by axial coords.
- Styled hex board layers and ghost targets to make placement affordances clearer.
- Added layout unit tests and a ghost click RTL test to validate intent dispatch.
- Updated changelog and PR task list to record the spatial board milestone.

---

## Commands Run

- `git checkout -b task/0043-hex-board-rendering`
  ```text

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
  packages/game test$ vitest run
  │ EXP-01 Setup Complete.
  │  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 9ms
  │  ✓ test/computeMajorirty.test.ts  (5 tests) 5ms
  │  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 4ms
  │  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
  │  ✓ test/player-view.test.ts  (2 tests) 5ms
  │  Test Files  22 passed (22)
  │       Tests  84 passed (84)
  │    Start at  22:38:36
  │    Duration  28.32s (transform 5.52s, setup 1ms, collect 36.01s, tests 4.91s, environment 4ms, prepare 57.10s)
  └─ Done in 30.7s
  packages/client-web test$ vitest run
  │  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
  │  ✓ test/hexLayout.test.ts  (2 tests) 4ms
  │  ✓ test/controls-start-committee.test.tsx  (1 test) 22ms
  │  ✓ test/Board.test.tsx  (7 tests) 48ms
  │  Test Files  3 passed (3)
  │       Tests  10 passed (10)
  │    Start at  22:39:07
  │    Duration  23.72s (transform 191ms, setup 0ms, collect 4.16s, tests 74ms, environment 23.27s, prepare 2.99s)
  └─ Done in 26.2s
  ```
- `git status`
  ```text
  Changes not staged for commit:
    (use "git add <file>..." to update what will be committed)
    (use "git restore <file>..." to discard changes in working directory)
          modified:   CHANGELOG.md
          modified:   docs/PR_TASK_LIST.md
          modified:   packages/client-web/src/components/GameLayout.tsx
          modified:   packages/client-web/src/index.css
          modified:   packages/client-web/test/Board.test.tsx

  Untracked files:
    (use "git add <file>..." to include in what will be committed)
          packages/client-web/src/components/HexBoard.tsx
          packages/client-web/src/ui/
          packages/client-web/test/hexLayout.test.ts

  no changes added to commit (use "git add" and/or "git commit -a")
  ```
- `git diff --stat`
  ```text
   docs/PR_TASK_LIST.md                              |  1 +
   packages/client-web/src/components/GameLayout.tsx |  4 +-
   packages/client-web/src/index.css                 | 48 +++++++++++++++++++++++
   packages/client-web/test/Board.test.tsx           | 35 ++++++++++++++++-
   5 files changed, 85 insertions(+), 4 deletions(-)
  ```
- `git add -A`
  ```text

  ```
- `git commit -m "task(0043): render spatial hex board" -m "- add axial layout helpers and spatial hex board rendering" -m "- style ghost targets and add layout/interaction tests" -m "- update task docs, changelog, and PR list"`
  ```text
  out helpers and spatial hex board rendering" -m "- style ghost targets and add layout/interaction tests" -m "- update task docs, changelog, and PR list"'
  error: unexpected argument 'render' found

  Usage: trae-sandbox.exe exec [OPTIONS] --storage-path <STORAGE_PATH> --config-name <CONFIG_NAME> --shell-path <SHELL_PATH> --command-line <COMMAND_LINE>

  For more information, try '--help'.
  ```
- `git commit -m 'task(0043): render spatial hex board' -m '- add axial layout helpers and spatial hex board rendering' -m '- style ghost targets and add layout/interaction tests' -m '- update task docs, changelog, and PR list'`
  ```text
  log, and PR list'''
  [task/0043-hex-board-rendering bf751d0] task(0043): render spatial hex board
   9 files changed, 369 insertions(+), 14 deletions(-)
   create mode 100644 packages/client-web/src/components/HexBoard.tsx
   create mode 100644 packages/client-web/src/ui/hexLayout.ts
   create mode 100644 packages/client-web/test/hexLayout.test.ts
  ```
- `node scripts/verify-task.mjs 0043`
  ```text
  [verify-task] OK: Section "Work Summary" present.
  [verify-task] OK: Section "Commands Run" present.
  [verify-task] OK: Latest commit format + task file inclusion OK (task(0043): render spatial hex board).

  [verify-task] PASS ✅
  ```
- `git show -1 --stat`
  ```text
  commit bf751d03926c8df0dafe8c03529d314545a953f6 (HEAD -> task/0043-hex-board-rendering)
  Author: Björn Ahlers <rewired.de@gmail.com>
  Date:   Sat Feb 14 23:09:05 2026 +0100

      task(0043): render spatial hex board

      - add axial layout helpers and spatial hex board rendering

      - style ghost targets and add layout/interaction tests

      - update task docs, changelog, and PR list

   CHANGELOG.md                                       |   1 +
   docs/PR_TASK_LIST.md                               |   1 +
   .../0043-hex-board-rendering-v1-spatial-layout.md  | 103 +++++++++++++++--
   packages/client-web/src/components/GameLayout.tsx  |   4 +-
   packages/client-web/src/components/HexBoard.tsx    | 124 +++++++++++++++++++++
   packages/client-web/src/index.css                  |  48 ++++++++
   packages/client-web/src/ui/hexLayout.ts            |  41 +++++++
   packages/client-web/test/Board.test.tsx            |  35 +++++-
   packages/client-web/test/hexLayout.test.ts         |  26 +++++
   9 files changed, 369 insertions(+), 14 deletions(-)
  :
  ```
- `git status -u`
  ```text
  Untracked files:
    (use "git add <file>..." to include in what will be committed)
          tatus'

  nothing added to commit but untracked files present (use "git add" to track)
  ```
- `git status`
  ```text
  nothing to commit, working tree clean
  ```
- `git diff --stat`
  ```text

  ```
- `git add -A`
  ```text
  (TraeAI-11) D:\__DEV\balance_control-anitgravity [0:0] $
  ```
- `git commit --amend --no-edit`
  ```text
   Date: Sat Feb 14 23:09:05 2026 +0100
   9 files changed, 451 insertions(+), 16 deletions(-)
   create mode 100644 packages/client-web/src/components/HexBoard.tsx
   create mode 100644 packages/client-web/src/ui/hexLayout.ts
   create mode 100644 packages/client-web/test/hexLayout.test.ts
  (TraeAI-11) D:\__DEV\balance_control-anitgravity [0:0] $
  (TraeAI-11) D:\__DEV\balance_control-anitgravity [0:0] $
  ```
