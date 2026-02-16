# Task 0075 - Client-Web: Simplify start flow (mode select) and make online lobby optional

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0075-client-web-simplify-start-flow-mode-select`

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
* GR-004
* GR-008

### compliance_notes

* GR-002: This is a start-flow refactor only. No rules logic is moved into the client.
* GR-004: Keep UI flow simple; do not add new frameworks.
* GR-008: Online multiplayer remains supported; this task only hides complexity behind a mode select.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* AGENTS: hotseat play + network multiplayer are both supported features
* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)

---

## 2) Goal

Reduce friction by splitting the start experience into two clear modes:

1) Local hotseat (2p) - the default path for quick play
2) Online lobby - available, but not the first thing you are forced to deal with

This directly addresses the "lobby feels unnecessarily complicated" problem without deleting features.

---

## 3) Non-Goals

* No removal of online lobby capabilities (create/join/list still exist).
* No rework of server/lobby protocol.
* No auth system.

---

## 4) Inputs

Current app root flow:

* `packages/client-web/src/App.tsx` (renders LobbyScreen unless already in a match)

Lobby UI:

* `packages/client-web/src/components/LobbyScreen.tsx`

Hotseat mode from Task 0071:

* `packages/client-web/src/hotseat/HotseatShell.tsx` (expected to exist after Task 0071)

Session persistence helpers:

* `packages/client-web/src/lobby/session.ts`

---

## 5) Outputs

### 5.1 Code

A) Add a lightweight StartScreen:

* Add: `packages/client-web/src/components/StartScreen.tsx`

  - Primary CTA: "Local hotseat (2p)"
  - Secondary CTA: "Online lobby"
  - Optional: show "Resume online session" only if a stored session exists (use existing `lobby/session.ts`)

B) Refactor `App.tsx` to use a simple mode state machine:

Possible states (example, keep minimal):

* `mode = 'start' | 'hotseat' | 'onlineLobby' | 'onlineMatch'`

Rules:

* Default entry is `start`.
* StartScreen chooses `hotseat` or `onlineLobby`.
* Online lobby continues into existing online match flow.
* A "Back to start" control exists in hotseat and online lobby modes (simple link/button).

C) Keep current lobby UI available:

* Existing `LobbyScreen` should render as-is (or with minimal changes), but only when mode = onlineLobby.

### 5.2 Tests

Add one minimal UI test to assert the mode select works:

* Example: `packages/client-web/src/components/__tests__/StartScreen.smoke.test.tsx`

  - Render App root
  - Click "Local hotseat (2p)" and assert the hotseat shell mounts
  - Click "Online lobby" and assert LobbyScreen mounts

### 5.3 Docs

Changelog / DD / ERRATA:

* [ ] `CHANGELOG.md` updated (optional, user-visible: start flow simplified)
* [ ] `/docs/design-decisions/DD-XXXX-start-flow-modes.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Do not change server endpoints or socket behavior.
* Do not remove any lobby functionality; only reorganize the entry flow.
* Keep URLs stable unless a query param is already used (avoid introducing routing frameworks).

---

## 7) Invariants (Must remain true)

* Online mode still works end-to-end after choosing it.
* Hotseat mode remains serverless.
* No engine changes.

---

## 8) Implementation Plan

* [ ] Implement StartScreen component.
* [ ] Refactor App to a mode-based start flow.
* [ ] Wire hotseat entry to `HotseatShell` (Task 0071 output).
* [ ] Ensure online lobby is reachable and unchanged.
* [ ] Add smoke test(s).
* [ ] Run workspace lint + tests.

---

## 9) Acceptance Criteria

* [ ] On load, user sees StartScreen (not the lobby complexity).
* [ ] Clicking Local hotseat starts a playable hotseat UI.
* [ ] Clicking Online lobby shows the existing lobby UI and online match still works.
* [ ] `pnpm -w lint` passes.
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] StartScreen added
* [x] App start flow simplified (mode select)
* [x] Online lobby still works
* [x] Hotseat still works
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Added `StartScreen` with Local hotseat / Online lobby mode select + optional Resume online session.
* Refactored `App.tsx` into a minimal mode state machine and removed lobby-as-default.
* Added "Back to start" controls for hotseat and online lobby modes.
* Updated lobby and session persistence tests for the new entry flow.
* Added a start-flow smoke test and updated `CHANGELOG.md`.

---

## 12) Commands Run (exact)

* `git switch -c task/0075-client-web-simplify-start-flow-mode-select` (created branch)
* `pnpm -w lint` (pass)
* `$env:NO_COLOR=1; pnpm -w test` (pass)
* `git status`
* `git diff --stat`
* `git diff --cached --stat`

---

## 13) Proof (screenshots / logs)

### git status

```text
On branch task/0075-client-web-simplify-start-flow-mode-select
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   CHANGELOG.md
	modified:   docs/tasks/0075-client-web-simplify-start-flow-mode-select.md
	modified:   packages/client-web/src/App.tsx
	new file:   packages/client-web/src/components/StartScreen.tsx
	modified:   packages/client-web/test/lobby-screen.test.tsx
	modified:   packages/client-web/test/lobby-session-persistence.test.tsx
	new file:   packages/client-web/test/start-flow-mode-select.smoke.test.tsx
```

### git diff --stat

```text
```

### git diff --cached --stat

```text
 CHANGELOG.md                                       |   1 +
 ...5-client-web-simplify-start-flow-mode-select.md | 177 +++++++++++++++++++--
 packages/client-web/src/App.tsx                    |  84 ++++++++--
 packages/client-web/src/components/StartScreen.tsx |  44 +++++
 packages/client-web/test/lobby-screen.test.tsx     |   5 +-
 .../test/lobby-session-persistence.test.tsx        |   9 +-
 .../test/start-flow-mode-select.smoke.test.tsx     |  61 +++++++
 7 files changed, 348 insertions(+), 33 deletions(-)
```

### $env:NO_COLOR=1; pnpm -w test

```text
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 88ms
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 26ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 13ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 12ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 31ms
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 32ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 32ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 15ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 27ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 34ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 56ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 40ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 127ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 237ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 24ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 270ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 9ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 10ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 5ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 11ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 5ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  16:33:29
packages/game test:    Duration  4.88s (transform 4.52s, setup 3ms, collect 23.84s, tests 1.12s, environment 7ms, prepare 5.30s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 7ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 16ms
packages/client-web test:  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 7ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 49ms
packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 86ms
packages/client-web test:  ✓ test/start-flow-mode-select.smoke.test.tsx  (1 test) 145ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 77ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 85ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 104ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 130ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 161ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 257ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 152ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 159ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 268ms
packages/client-web test:  ✓ test/no-game-src-imports.test.ts  (1 test) 7ms
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test:    Start at  16:33:35
packages/client-web test:    Duration  5.30s (transform 1.56s, setup 4ms, collect 13.96s, tests 1.71s, environment 38.95s, prepare 4.15s)
packages/client-web test: Done
```

---

## 14) Commit Message

Required format:

* Subject: `task(0075): <summary>`
* Body: at least 2 bullet lines, e.g.

  - `- ...`
  - `- ...`
  
Planned:

* Subject: `task(0075): simplify client start flow mode select`
* Body:

  - `- Add StartScreen mode selector with optional session resume.`
  - `- Refactor App start flow to hide lobby by default and update client-web tests.`

---

## 15) Amendments (append-only)

* None
