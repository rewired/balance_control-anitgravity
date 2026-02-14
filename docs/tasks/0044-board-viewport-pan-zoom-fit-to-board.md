# Codex Task 0044 - Board Viewport: Pan/Zoom + Fit-to-Board (Playable Camera)

**Date:** 2026-02-14
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Determinism (engine): AGENTS 0.2
- Client is presentation only: ARCH-01, AGENTS 1.5
- Use NPM solutions where useful: AGENTS 0.3

---

## Goal

Make the board actually playable:

- pan and zoom (mouse drag + wheel)
- "fit to board" on load and whenever bounds change
- reset view control

Camera/UI only; no engine changes.

---

## Inputs

- Task 0043 provides `HexBoard` rendering in pixel space and a bounds helper (`computeBounds` or equivalent).
- Current `GameLayout` renders the board in the center panel.

---

## Outputs

### A) Add a maintained pan/zoom dependency

Add to `packages/client-web`:

- `react-zoom-pan-pinch` (recommended) or another maintained equivalent

Update `package.json` and lockfile accordingly.

### B) Implement viewport wrapper

Add: `packages/client-web/src/components/BoardViewport.tsx`

- Wrap `HexBoard` in the pan/zoom provider/component.
- Provide:
  - wheel zoom enabled
  - drag-to-pan enabled
  - sensible min/max scale (example 0.25..2.5)
- Add a small overlay button: "Reset view"

### C) Fit-to-board algorithm (pure helper + unit tests)

Add: `packages/client-web/src/ui/fitToBounds.ts` (pure)

- `computeFitTransform(bounds, viewportSize, paddingPx) -> { scale, x, y }`
- Deterministic math only; no DOM calls in the helper.
- Add unit tests for expected outputs on known bounds + viewport sizes.

Note: jsdom layout sizes are unreliable; tests must target the pure helper, not DOM measurement.

### D) Integrate fit-to-board into the viewport

- On first render and when bounds change, compute the fit transform and apply it via the pan/zoom library API.
- Avoid `setTimeout` hacks. Prefer library init callbacks if required.

### E) Wire into layout

Update `packages/client-web/src/components/GameLayout.tsx`:

- Replace direct `HexBoard` usage with `BoardViewport` wrapping it.

### F) Bookkeeping

- Add this file: `docs/tasks/0044-board-viewport-pan-zoom-fit-to-board.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0044)
- Update `CHANGELOG.md` (Unreleased):
  - Client: board camera with pan/zoom + fit-to-board.

---

## Constraints

- No time-based behavior required for correctness (no animation timers).
- Keep fit computation pure and covered by unit tests.
- No changes to engine rules.

---

## Invariants

- Camera does not affect legality or move resolution.
- Interaction remains deterministic in the engine; camera state may be local UI state.

---

## Acceptance Criteria

1. In dev: you can zoom out to see the cluster, pan freely, and reset view.
2. Fit-to-board frames the current placed tiles + ghosts with padding.
3. `pnpm -w test` is green.

---

## PR Checklist

- [x] Add pan/zoom dependency (maintained)
- [x] Add `BoardViewport` wrapper with reset control
- [x] Add pure `fitToBounds` helper + unit tests
- [x] Wire viewport into `GameLayout`
- [x] Update `docs/PR_TASK_LIST.md`
- [x] Update `CHANGELOG.md` (Unreleased)
- [x] CI green

---

## Work Summary

- Added a pan/zoom viewport wrapper that fits the board on load and bounds changes.
- Introduced a pure fit-to-bounds helper with unit tests for deterministic framing.
- Centralized board bounds/layout computation for consistent viewport sizing.
- Updated layout styles to keep the board viewport contained with reset control.
- Recorded Task 0044 in the PR task list and changelog.

---

## Commands Run

- `pnpm -C packages/client-web add react-zoom-pan-pinch`
  ```text
  ../..                                    |  WARN  deprecated eslint@8.57.1
  ../..                                    | Progress: resolved 477, reused 0, downloaded 0, added 0, done
  ../..                                    |   +1 +
  Done in 2.8s using pnpm v10.18.0
  ```
- `pnpm -w test`
  ```text
  > balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
  > pnpm -r --if-present test

  Scope: 9 of 10 workspace projects
  packages/game test$ vitest run
  [56 lines collapsed]
  │ stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
  │ Expansion registered: ModExp
  │  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 4ms
  │  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
  │  ✓ test/player-view.test.ts  (2 tests) 5ms
  │  Test Files  22 passed (22)
  │       Tests  84 passed (84)
  │    Start at  00:01:57
  │    Duration  28.79s (transform 5.11s, setup 0ms, collect 49.64s, tests 2.05s, environment 5ms, prepare 58.87s)
  └─ Done in 31.2s
  packages/client-web test$ vitest run
  │  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
  │  ✓ test/fitToBounds.test.ts  (3 tests) 4ms
  │  ✓ test/hexLayout.test.ts  (2 tests) 3ms
  │  ✓ test/controls-start-committee.test.tsx  (1 test) 23ms
  │  ✓ test/Board.test.tsx  (7 tests) 45ms
  │  Test Files  4 passed (4)
  │       Tests  13 passed (13)
  │    Start at  00:02:28
  │    Duration  26.09s (transform 182ms, setup 0ms, collect 4.20s, tests 75ms, environment 39.27s, prepare 4.52s)
  └─ Done in 28.7s
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
<<<<<<< HEAD
- `git status -u`
  ```text
  On branch main
  Your branch is up to date with 'origin/main'.
  Changes not staged for commit:
    (use "git add <file>..." to update what will be committed)
    (use "git restore <file>..." to discard changes in working directory)
          modified:   CHANGELOG.md
          modified:   docs/PR_TASK_LIST.md
          modified:   docs/tasks/0044-board-viewport-pan-zoom-fit-to-board.md
          modified:   packages/client-web/package.json
          modified:   packages/client-web/src/components/GameLayout.tsx
          modified:   packages/client-web/src/components/HexBoard.tsx
          modified:   packages/client-web/src/index.css
          modified:   packages/client-web/src/ui/hexLayout.ts
          modified:   pnpm-lock.yaml

  Untracked files:
    (use "git add <file>..." to include in what will be committed)
          packages/client-web/src/components/BoardViewport.tsx
          packages/client-web/src/ui/fitToBounds.ts
          packages/client-web/test/fitToBounds.test.ts
=======
- `git switch -c task/0044-board-viewport-pan-zoom`
  ```text
  ```
- `$env:GIT_PAGER='cat'; git status -u`
  ```text
  Changes not staged for commit:
    (use "git add <file>..." to update what will be committed)
    (use "git restore <file>..." to discard changes in working directory)
          modified:   docs/tasks/0044-board-viewport-pan-zoom-fit-to-board.md
>>>>>>> d8d692b2a935ede04ba2c45a794ce5d29222fd48

  no changes added to commit (use "git add" and/or "git commit -a")
  ```
- `git diff --stat`
  ```text
<<<<<<< HEAD
   docs/PR_TASK_LIST.md                               |  1 +
   .../0044-board-viewport-pan-zoom-fit-to-board.md   | 32 +++++++++------
   packages/client-web/package.json                   |  3 +-
   packages/client-web/src/components/GameLayout.tsx  |  4 +-
   packages/client-web/src/components/HexBoard.tsx    | 20 ++--------
   packages/client-web/src/index.css                  | 33 +++++++++++++++-
   packages/client-web/src/ui/hexLayout.ts            | 46 +++++++++++++++++++---
   pnpm-lock.yaml                                     | 15 +++++++
   9 files changed, 117 insertions(+), 38 deletions(-)
=======
   1 file changed, 30 insertions(+)
  ```
- `$env:GIT_PAGER='cat'; git --no-pager show -1 --stat`
  ```text
  commit 2c17e68b93fc9bf13c2e49c5d994a1b3f9ded4b1 (HEAD -> task/0044-board-viewport-pan-zoom, main)
  Author: Björn Ahlers <rewired.de@gmail.com>
  Date:   Sun Feb 15 00:06:52 2026 +0100
      task(0044): add board viewport camera

      - add BoardViewport with pan/zoom and reset fit

      - add fit-to-bounds helper tests and shared layout bounds

      - update client dependency, changelog, and PR task list

   CHANGELOG.md                                       |   1 +
   docs/PR_TASK_LIST.md                               |   1 +
   .../0044-board-viewport-pan-zoom-fit-to-board.md   | 118 +++++++++++++++++++--
   packages/client-web/package.json                   |   3 +-
   .../client-web/src/components/BoardViewport.tsx    | 114 ++++++++++++++++++++
   packages/client-web/src/components/GameLayout.tsx  |   4 +-
   packages/client-web/src/components/HexBoard.tsx    |  20 +---
   packages/client-web/src/index.css                  |  33 +++++-
   packages/client-web/src/ui/fitToBounds.ts          |  20 ++++
   packages/client-web/src/ui/hexLayout.ts            |  46 ++++++--
   packages/client-web/test/fitToBounds.test.ts       |  29 +++++
   pnpm-lock.yaml                                     |  15 +++
   12 files changed, 366 insertions(+), 38 deletions(-)
  ```
- `$env:GIT_PAGER='cat'; node scripts/verify-task.mjs 0044`
  ```text
  [verify-task] OK: Section "Work Summary" present.
  [verify-task] OK: Section "Commands Run" present.
  [verify-task] OK: Latest commit format + task file inclusion OK (task(0044): add board viewport camera).

  [verify-task] PASS ✅
  ```
- `git add -A`
  ```text
  ```
- `git commit --amend --no-edit`
  ```text
   Date: Sun Feb 15 00:06:52 2026 +0100
   12 files changed, 380 insertions(+), 38 deletions(-)
   create mode 100644 packages/client-web/src/components/BoardViewport.tsx
   create mode 100644 packages/client-web/src/ui/fitToBounds.ts
   create mode 100644 packages/client-web/test/fitToBounds.test.ts
>>>>>>> d8d692b2a935ede04ba2c45a794ce5d29222fd48
  ```
