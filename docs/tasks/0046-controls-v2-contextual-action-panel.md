# Codex Task 0046 - Controls v2: Contextual Action Panel (No Button Spam)

**Date:** 2026-02-14
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- Intent-driven UI: Tasks 0026-0028
- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5
- Turn stages: CORE-01-04 (via ctx.activePlayers)

---

## Goal

Replace the current "list every intent as a button" with a usable control scheme:

- primary action is obvious
- secondary actions are grouped/collapsible
- controls react to stage and selection
- still driven ONLY by legal intents

No new rules. No hiding actions by guessing legality.

---

## Inputs

- `packages/client-web/src/components/Controls.tsx` (current)
- `LegalIntent[] intents` already enumerated
- `GameLayout` already provides `stage`, `selectedTileId`, `stagedTileId`

---

## Outputs

### A) Add ActionPanel component

Add: `packages/client-web/src/components/ActionPanel.tsx`

Props (suggested, adjust as needed):

- `moves`, `isActive`, `stage`, `intents`
- `selectedTileId`, `stagedTileId`

UI requirements:

- Stage header (Draw & Place / Political Action / etc.)
- Primary action slot:
  - In `drawAndPlace`: show staged tile id (if any) + show "Skip placement" if legal
  - In `politicalAction`: show "Place influence" enabled only if there is a matching legal intent for `selectedTileId`
- Secondary actions in a "More actions" disclosure:
  - moveInfluence, formalizeInfluence, convertResources, pass, etc.
- If an action requires selection and none is selected: show disabled + short hint text.

### B) Deterministic grouping and ordering

- Exclude `resolveChoice` here (handled by Task 0047 modal).
- Always render "Pass" and "Skip placement" last (when legal).
- Sort other intents deterministically:
  - group by `moveType`
  - within group, stable sort by a deterministic key (for example JSON string of payload)

### C) Replace current Controls usage

Update `packages/client-web/src/components/GameLayout.tsx`:

- Replace the bottom `Controls` bar with `ActionPanel`.
- Keep it compact; it must not cover the board center.

### D) Tests

Add RTL tests:

- With a selected tile that has a matching `placeInfluence` intent, the primary button is enabled.
- Without selection, primary place influence is disabled (and does not dispatch).
- Secondary list shows at least one non-primary intent and clicking dispatches exactly one move.

### E) Bookkeeping

- Add this file: `docs/tasks/0046-controls-v2-contextual-action-panel.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0046)
- Update `CHANGELOG.md` (Unreleased):
  - Client: contextual action panel replaces intent button spam.

---

## Constraints

- No legality computation in UI. Enablement is based on existence of matching legal intents only.
- Do not hide actions by inventing new rules; only group and label.

---

## Invariants

- Every clickable action maps 1:1 to a legal intent payload and calls exactly one `moves.*` function.
- No changes to engine rules.

---

## Acceptance Criteria

1. During play, the controls remain readable and do not explode into 20+ buttons.
2. The primary action is always obvious for the current stage.
3. `pnpm -w test` is green.

---

## PR Checklist

- [x] Add `ActionPanel` (stage + selection aware)
- [x] Replace `Controls` with `ActionPanel` in layout
- [x] Deterministic grouping + ordering of intents (excluding resolveChoice)
- [x] Tests for enablement + dispatch
- [x] Update `docs/PR_TASK_LIST.md`
- [x] Update `CHANGELOG.md` (Unreleased)
- [x] CI green

---

## Work Summary

- Added ActionPanel with stage-aware primary actions and collapsible secondary actions.
- Grouped and ordered legal intents deterministically, excluding resolveChoice and trailing pass/skip.
- Wired ActionPanel into the layout and styled it to stay compact over the board.
- Added RTL coverage for ActionPanel enablement/dispatch and hardened cleanup in UI tests.
- Updated PR task list and changelog to reflect the new control scheme.

---

## Commands Run

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
  [56 lines collapsed]
  │ Expansion registered: EXP-02 Security & Order
  │ EXP-02 Setup Complete.
  │  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 10ms
  │  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
  │  ✓ test/player-view.test.ts  (2 tests) 5ms
  │  Test Files  22 passed (22)
  │       Tests  84 passed (84)
  │    Start at  01:28:15
  │    Duration  29.07s (transform 5.45s, setup 1ms, collect 48.02s, tests 1.98s, environment 5ms, prepare 58.82s)
  └─ Done in 31.4s
  packages/client-web test$ vitest run
  [1 lines collapsed]
  │  ✓ test/hexLayout.test.ts  (2 tests) 3ms
  │  ✓ test/fitToBounds.test.ts  (3 tests) 4ms
  │  ✓ test/controls-start-committee.test.tsx  (1 test) 63ms
  │  ✓ test/Board.test.tsx  (7 tests) 109ms
  │  ✓ test/action-panel.test.tsx  (3 tests) 91ms
  │  ✓ test/selection-inspector.test.tsx  (2 tests) 131ms
  │  Test Files  6 passed (6)
  │       Tests  18 passed (18)
  │    Start at  01:28:47
  │    Duration  32.96s (transform 517ms, setup 1ms, collect 15.68s, tests 401ms, environment 85.02s, prepare 9.01s)
  └─ Done in 35.5s
  ```
- `git --no-pager status --untracked-files=all`
  ```text
  Your branch is up to date with 'origin/main'.

  Changes not staged for commit:
    (use "git add <file>..." to update what will be committed)
    (use "git restore <file>..." to discard changes in working directory)
          modified:   CHANGELOG.md
          modified:   docs/PR_TASK_LIST.md
          modified:   docs/tasks/0046-controls-v2-contextual-action-panel.md
          modified:   packages/client-web/src/components/GameLayout.tsx
          modified:   packages/client-web/src/index.css
          modified:   packages/client-web/test/controls-start-committee.test.tsx
          modified:   packages/client-web/test/selection-inspector.test.tsx

  Untracked files:
    (use "git add <file>..." to include in what will be committed)
          packages/client-web/src/components/ActionPanel.tsx
          packages/client-web/test/action-panel.test.tsx

  no changes added to commit (use "git add" and/or "git commit -a")
  ```
- `git --no-pager diff --stat`
  ```text
   docs/PR_TASK_LIST.md                               |   1 +
   .../0046-controls-v2-contextual-action-panel.md    | 108 ++++++++++++++++++---
   packages/client-web/src/components/GameLayout.tsx  |   4 +-
   packages/client-web/src/index.css                  |  58 +++++++++++
   .../test/controls-start-committee.test.tsx         |  24 ++---
   .../client-web/test/selection-inspector.test.tsx   |  12 ++-
   7 files changed, 173 insertions(+), 35 deletions(-)
  ```
