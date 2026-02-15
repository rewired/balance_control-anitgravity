# Codex Task 0047 - PendingChoice Modal: Block Until Resolved (No UX Dead Ends)

**Date:** 2026-02-14
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- PendingChoice determinism: Task 0009
- Intent-driven UI: Tasks 0026-0028
- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5

---

## Goal

When the engine requires a choice, the UI must:

- make the choice unavoidable (modal overlay)
- show only legal `resolveChoice` intents
- dispatch `resolveChoice` deterministically

This prevents "game feels stuck" moments.

---

## Inputs

- `intents` may include moveType `resolveChoice` with payload (selection)
- Current UI renders resolveChoice as just another button (easy to miss)
- `GameLayout` has access to `intents` and `moves`

---

## Outputs

### A) Add blocking modal component

Add: `packages/client-web/src/components/PendingChoiceModal.tsx`

Behavior:

- Render only when `intents` includes at least one `resolveChoice`
- Show title "Decision required"
- Render the choice buttons ordered deterministically:
  - stable sort by payload JSON string (or an explicit key)
- Clicking a choice calls `moves.resolveChoice(payload)` exactly once
- Overlay blocks other interactions (pointer-events) while visible

### B) Integrate into GameLayout

Update `packages/client-web/src/components/GameLayout.tsx`:

- Render `PendingChoiceModal` above the board and panels.
- While modal is visible:
  - disable or hide `ActionPanel` (Task 0046) so no other moves can be dispatched

### C) CSS

Update `packages/client-web/src/index.css`:

- Modal overlay (centered card, backdrop blur/dim)
- Clear focus/hover states for choice buttons

### D) Tests

Add RTL tests:

- Given resolveChoice intents, modal appears.
- While modal visible, other control buttons are disabled or not present.
- Clicking a choice calls `moves.resolveChoice` with the correct payload.

### E) Bookkeeping

- Add this file: `docs/tasks/0047-pendingchoice-modal-blocking-resolvechoice.md`
- Update `docs/PR_TASK_LIST.md` (add Task 0047)
- Update `CHANGELOG.md` (Unreleased):
  - Client: PendingChoice modal blocks play until resolveChoice is dispatched.

---

## Constraints

- No new choice semantics in UI. Only render the legal intents from the engine.
- Deterministic ordering required.
- No engine changes.

---

## Invariants

- While PendingChoice exists, UI must not dispatch other moves.
- No changes to legality logic.

---

## Acceptance Criteria

1. Any pending choice is immediately obvious and resolvable.
2. No "where do I click now?" dead-ends.
3. `pnpm -w test` is green.

---

## PR Checklist

- [x] Add `PendingChoiceModal` component
- [x] Wire modal into `GameLayout` as blocking overlay
- [x] Disable/hide other controls while modal visible
- [x] Tests for modal visibility + dispatch + blocking behavior
- [x] Update `docs/PR_TASK_LIST.md`
- [x] Update `CHANGELOG.md` (Unreleased)
- [x] CI green

---

## Work Summary

- Added PendingChoice modal that renders resolveChoice intents deterministically.
- Blocked board and action panel interactions while a choice is pending.
- Styled the modal overlay and buttons for clear focus/hover states.
- Added RTL coverage for modal visibility, blocking, and resolveChoice dispatch.
- Updated changelog and PR task list entries.

---

## Commands Run

- `git -c core.pager=cat status -sb`
  ```text
   M CHANGELOG.md
   M docs/PR_TASK_LIST.md
   M docs/tasks/0047-pendingchoice-modal-blocking-resolvechoice.md
   M packages/client-web/src/components/GameLayout.tsx
   M packages/client-web/src/index.css
  ?? packages/client-web/src/components/PendingChoiceModal.tsx
  ?? packages/client-web/test/pending-choice-modal.test.tsx
  ```
- `git -c core.pager=cat diff --stat`
  ```text
   docs/PR_TASK_LIST.md                               |  1 +
   ...7-pendingchoice-modal-blocking-resolvechoice.md | 88 +++++++++++++++++++---
   packages/client-web/src/components/GameLayout.tsx  | 32 +++++---
   packages/client-web/src/index.css                  | 52 +++++++++++++
   5 files changed, 154 insertions(+), 20 deletions(-)
  ```
- `pnpm -w test`
  ```text
  > balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
  > pnpm -r --if-present test

  Scope: 9 of 10 workspace projects
  packages/game test$ vitest run
  [56 lines collapsed]
  │ stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inn…
  │ Expansion registered: EXP-02 Security & Order
  │  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 8ms
  │  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
  │  ✓ test/player-view.test.ts  (2 tests) 5ms
  │  Test Files  22 passed (22)
  │       Tests  84 passed (84)
  │    Start at  01:58:45
  │    Duration  28.98s (transform 5.23s, setup 3ms, collect 38.19s, tests 1.71s, environment 4ms, prepare 57.91s)
  └─ Done in 31.4s
  packages/client-web test$ vitest run
  [2 lines collapsed]
  │  ✓ test/hexLayout.test.ts  (2 tests) 4ms
  │  ✓ test/selection-inspector.test.tsx  (2 tests) 103ms
  │  ✓ test/action-panel.test.tsx  (3 tests) 66ms
  │  ✓ test/controls-start-committee.test.tsx  (1 test) 41ms
  │  ✓ test/Board.test.tsx  (7 tests) 59ms
  │  ✓ test/pending-choice-modal.test.tsx  (3 tests) 68ms
  │  Test Files  7 passed (7)
  │       Tests  21 passed (21)
  │    Start at  01:59:16
  │    Duration  35.94s (transform 497ms, setup 1ms, collect 21.46s, tests 347ms, environment 116.68s, prepare 11.34s)
  └─ Done in 38.5s
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
