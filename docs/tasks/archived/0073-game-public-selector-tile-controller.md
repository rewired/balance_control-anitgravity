# Task 0073 - Game package: Public selector for tile controller + remove client source import

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0073-game-public-selector-tile-controller`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT -> FROZEN -> IMPLEMENTING -> VERIFYING -> COMMIT_READY -> DONE**

Rules (non-negotiable):

* Before touching code: set **Task State = FROZEN** and complete **Sections 0-9**.
* After FROZEN: **Sections 0-9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do not rewrite earlier sections.
* During IMPLEMENTING/VERIFYING: you may only:

  * check boxes in Section 10
  * fill Sections 11-14 (Work Summary / Commands / Proof)

Iteration budget (hard stop):

* Max 2 fix cycles after the first full test run. If still failing: STOP and report blockers.

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-010

### compliance_notes

* GR-002: Client must not import engine source files directly. Any rule-relevant computation used by UI must be accessed via `@balance-control/game` exports.
* GR-010: Add a stable, documented export surface for the minimal selector needed by the client (`selectTileController` or equivalent).

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* CORE: CORE-01-05 (control computed by computeMajority)

---

## 2) Goal

Fix the current client-web contract breach:

* client-web currently imports from `packages/game/src/...` (source import)
* this breaks package boundaries and makes builds fragile

Provide a stable export from `@balance-control/game` that allows the UI to render tile control safely without importing internal source files.

---

## 3) Non-Goals

* No change to the computeMajority algorithm.
* No state shape changes.
* No changes to intent enumeration or move legality.

---

## 4) Inputs

Current violating import site:

* `packages/client-web/src/components/HexBoard.tsx`

  - imports `computeMajority` from `../../../game/src/mechanics`

Relevant engine implementation:

* `packages/game/src/mechanics.ts` (computeMajority)
* `packages/game/src/index.ts` (package export surface)

---

## 5) Outputs

### 5.1 Code

A) Add a stable selector export to `@balance-control/game`:

Pick ONE of the following patterns (do not export the entire mechanics module):

* Option 1 (preferred): add `selectTileController(tileId, G)` that returns `string | null`
* Option 2: export `computeMajority` directly (only if Option 1 is not practical)

Implementation lives in `packages/game/src/...` and is exported from `packages/game/src/index.ts`.

B) Refactor client-web to use only the package export:

* Update `packages/client-web/src/components/HexBoard.tsx` to import from `@balance-control/game`.

C) Add a cheap boundary tripwire:

* Add a small script OR test that fails if client-web imports `packages/game/src` directly.

  - Example: grep for `/game/src/` in `packages/client-web/src` in a vitest or node script.
  - Keep it simple and stable.

### 5.2 Tests

* Update / add tests as needed so `pnpm -w test` passes.
* Ensure existing game tests for majority still pass.

### 5.3 Docs

N/A

Changelog / DD / ERRATA:

* [x] `CHANGELOG.md` updated (N/A: internal refactor)
* [x] `/docs/design-decisions/DD-XXXX-public-game-selectors.md` created (N/A)
* [x] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* The export surface must remain small and intentional (no "export * from mechanics").
* No new cross-workspace circular dependencies.
* The boundary tripwire must not be flaky (no reliance on environment-specific paths).

---

## 7) Invariants (Must remain true)

* Majority / controller results are unchanged relative to current behavior.
* Client rendering continues to show control correctly.
* No new rule logic is duplicated in client-web.

---

## 8) Implementation Plan

* [ ] Add `selectTileController` (or export `computeMajority`) and export it from `@balance-control/game`.
* [ ] Update HexBoard import to use the package export.
* [ ] Add boundary tripwire (script/test).
* [ ] Run workspace lint + tests.

---

## 9) Acceptance Criteria

* [ ] No imports from `packages/game/src/*` remain anywhere outside `packages/game`.
* [ ] Client still renders controller / majority marker correctly.
* [ ] Boundary tripwire exists and passes.
* [ ] `pnpm -w lint` passes.
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Stable game export added (minimal)
* [x] Client uses package export only
* [x] Boundary tripwire added
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Added `selectTileController(tileId, G)` as a minimal public selector in `@balance-control/game`.
* Refactored `HexBoard` to use the package export instead of importing `game/src` directly.
* Added a Vitest boundary tripwire that fails if client source reintroduces `/game/src/` imports.
* Updated client-web tests to partial-mock `@balance-control/game` so new exports don’t break mocks.

---

## 12) Commands Run (exact)

* `git checkout -b task/0073-game-public-selector-tile-controller` (ok)
* `pnpm -w lint` (pass)
* `$env:NO_COLOR=1; pnpm -w test` (pass)
* `git status` (see Proof)
* `git diff --stat` (see Proof)
* `git add -A` (ok)
* `git commit -m "task(0073): add public tile controller selector" -m "- Export selectTileController from @balance-control/game for UI use" -m "- Remove client-web source import of game/src and add a boundary tripwire test"` (ok)
* `git show -1 --stat` (see Proof)

---

## 13) Proof (screenshots / logs)

### `git status`

```txt
On branch task/0073-game-public-selector-tile-controller
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0073-game-public-selector-tile-controller.md
	modified:   packages/client-web/src/components/HexBoard.tsx
	modified:   packages/client-web/test/drawpile-and-discard-ui.test.tsx
	modified:   packages/client-web/test/pending-choice-modal.test.tsx
	modified:   packages/client-web/test/public-notice-unplaceable.test.tsx
	modified:   packages/client-web/test/selection-inspector.test.tsx
	modified:   packages/game/src/client-game.ts
	modified:   packages/game/src/index.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/test/no-game-src-imports.test.ts
	packages/game/src/public-selectors.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

### `git diff --stat`

```txt
 docs/tasks/0073-game-public-selector-tile-controller.md    | 14 +++++++-------
 packages/client-web/src/components/HexBoard.tsx            |  4 ++--
 packages/client-web/test/drawpile-and-discard-ui.test.tsx  | 11 +++++++----
 packages/client-web/test/pending-choice-modal.test.tsx     | 10 +++++++---
 .../client-web/test/public-notice-unplaceable.test.tsx     | 11 +++++++----
 packages/client-web/test/selection-inspector.test.tsx      | 10 +++++++---
 packages/game/src/client-game.ts                           |  2 ++
 packages/game/src/index.ts                                 |  1 +
 8 files changed, 40 insertions(+), 23 deletions(-)
```

### `pnpm -w lint`

```txt
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
```

### `$env:NO_COLOR=1; pnpm -w test`

```txt
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 147ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 16ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 37ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 14ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 21ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 17ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 23ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 33ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 25ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 35ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 58ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 45ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 138ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 239ms
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 12ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 10ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 295ms
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 15ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 17ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 11ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 5ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 6ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  15:37:11
packages/game test:    Duration  5.51s (transform 4.75s, setup 3ms, collect 37.03s, tests 1.22s, environment 6ms, prepare 6.15s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/no-game-src-imports.test.ts  (1 test) 38ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 8ms
packages/client-web test:  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 29ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 70ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 88ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 8ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 124ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 284ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 162ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 167ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 186ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 141ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 74ms
packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 67ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 207ms
packages/client-web test:  Test Files  15 passed (15)
packages/client-web test:       Tests  47 passed (47)
packages/client-web test:    Start at  15:37:18
packages/client-web test:    Duration  5.50s (transform 1.24s, setup 4ms, collect 12.86s, tests 1.65s, environment 39.79s, prepare 6.29s)
packages/client-web test: Done
```

### `git show -1 --stat`

```txt
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 15:39:31 2026 +0100

    task(0073): add public tile controller selector

- Export selectTileController from @balance-control/game for UI use

- Remove client-web source import of game/src and add a boundary tripwire test

 .../0073-game-public-selector-tile-controller.md   | 193 +++++++++++++++++++--
 packages/client-web/src/components/HexBoard.tsx    |   4 +-
 .../test/drawpile-and-discard-ui.test.tsx          |  11 +-
 .../client-web/test/no-game-src-imports.test.ts    |  40 +++++
 .../client-web/test/pending-choice-modal.test.tsx  |  10 +-
 .../test/public-notice-unplaceable.test.tsx        |  11 +-
 .../client-web/test/selection-inspector.test.tsx   |  10 +-
 packages/game/src/client-game.ts                   |   2 +
 packages/game/src/index.ts                         |   1 +
 packages/game/src/public-selectors.ts              |   8 +
 10 files changed, 257 insertions(+), 33 deletions(-)
```

### `git status` (post-commit)

```txt
On branch task/0073-game-public-selector-tile-controller
nothing to commit, working tree clean
```

---

## 14) Commit Message

Required format:

* Subject: `task(0073): <summary>`
* Body: at least 2 bullet lines, e.g.

  - `- ...`
  - `- ...`

Planned:

* Subject: `task(0073): add public tile controller selector`
* Body:
  - `- Export selectTileController from @balance-control/game for UI use`
  - `- Remove client-web source import of game/src and add a boundary tripwire test`

---

## 15) Amendments (append-only)

* None
