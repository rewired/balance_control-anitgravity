# Task 0050 — Client-Web: Lobby Start Screen (Create/List/Join) + Quit (leaveMatch)

**Date:** 2026-02-15
**Owner:** Codex
**Branch:** `task/0050-client-web-lobby-start-screen`

---

**Task State:** FROZEN

## Task State Machine (Loop-Breaker)

States: **DRAFT → FROZEN → IMPLEMENTING → VERIFYING → COMMIT_READY → DONE**

Rules (non-negotiable):

* **Before touching code:** set **Task State = FROZEN** and complete **Sections 0–9**.
* **After FROZEN:** **Sections 0–9 are read-only.** If anything must change, append an entry to **Section 15 (Amendments, append-only)**. Do **not** rewrite earlier sections.
* During **IMPLEMENTING/VERIFYING:** you may only:

  * check boxes in **Section 10**
  * fill **Sections 11–14** (Work Summary / Commands / Proof)
* If scope changes beyond small amendments: **STOP** and create a **new task file**.

Iteration budget (hard stop):

* **Max 2 fix cycles** after the **first full test run**. If still failing: **STOP and report blockers** (no infinite “try again”).

---

## 0) Masterplan Guardrails (MUST)

**Guardrails file:** `/docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`

### affected_guardrails

* GR-002
* GR-005
* GR-014

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Lobby UI only calls Lobby API + dispatches existing `moves.*` from the engine; it does not compute legality/costs/majority.
* GR-005: No new moves/intents are introduced; “Quit game” is UI-only and uses Lobby `leaveMatch` (not an engine move).
* GR-014: Keep tile/icon mapping untouched; lobby UI styling must not change tile rendering semantics.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-01:CLIENT_RESTRICTIONS
* ARCH: ARCH-01:LEGALITY_ENUMERATION

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* App starts on a Lobby start screen (classic boardgame.io lobby UX), not directly in a match.
* Lobby supports: list matches, create match (numPlayers + expansions), and join a specific seat with a player name.
* Joining a seat immediately transitions into the in-game screen using `SocketIO` multiplayer with the returned `playerCredentials`.
* In-game screen has a “Quit game” button that calls Lobby `leaveMatch`, stops the client, and returns to the Lobby screen.

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* Do not implement AI players, hotseat-only local mode, or any non-lobby matchmaking.
* Do not implement rule variants or player “type” selection (only stub UI, disabled, TODO).
* Do not implement session persistence / resume (handled in Task 0051).
* Do not change engine rules, legality, or state shape.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `packages/client-web/src/App.tsx` (currently boots directly into match via URL/env)
  * `packages/client-web/src/Board.tsx` + `packages/client-web/src/components/*` (current in-game UI)
  * `packages/server/src/index.ts` (boardgame.io server on port 8000)
  * `packages/game/src/setup.ts` + `packages/game/src/config.ts` (setupData → expansions flags)
* Existing behavior summary (current):

  * Web client immediately starts a match using URL params/env (`player`, `match`, `VITE_MULTIPLAYER`).
  * No lobby, no create/join, no quit/leave.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* `packages/client-web/src/App.tsx` updated to support screen switching: Lobby ↔ Game.
* `packages/client-web/src/components/LobbyScreen.tsx` added (or equivalent) using boardgame.io `LobbyClient`.
* In-game “Quit game” UI wired to `leaveMatch` (likely in `packages/client-web/src/components/GameLayout.tsx` or a new top bar component).

### 5.2 Tests

* `packages/client-web/test/lobby-screen.test.tsx` added:
  * list matches renders seats
  * join transitions to game screen using returned credentials
  * quit calls `leaveMatch` and returns to lobby

### 5.3 Docs

* [ ] `CHANGELOG.md` updated (Unreleased): Lobby start screen + join/quit via boardgame.io lobby.
* [ ] `docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) — N/A expected.
* [ ] `docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A.

---

## 6) Constraints (Hard)

* Determinism: no time, no Math.random, no non-seeded sources in engine (client is allowed to use time for display only, but avoid it).
* Engine authority: rules/legality/costs computed only in `packages/game`.
* Lobby strictness: create/list/join/leave must use boardgame.io Lobby API (`LobbyClient`), not custom server endpoints.
* No phantom moves: do not add engine moves for “quit” or lobby actions.
* Expansion isolation: UI toggles only affect `setupData` for match creation; no client-side expansion state.

---

## 7) Invariants (Must remain true)

* UI remains presentation-only; no legality computation in client.
* Existing in-game UI remains intent-driven (ActionPanel, ghost hexes) and uses existing engine `enumerateLegalIntents`.
* “Quit game” does not mutate engine state; it only leaves the match via Lobby API and stops the client.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Add `LobbyScreen` component:
  * [ ] Create `LobbyClient({ server: VITE_SERVER_URL })`.
  * [ ] Load match list via `listMatches(BalanceControl.name)` with refresh button.
  * [ ] Create-match form:
    * [ ] `numPlayers` select (2–6).
    * [ ] expansion toggles `ex01/ex02/ex03` stored in local UI state.
    * [ ] “player type” + “rule variants” inputs present but disabled + TODO label.
    * [ ] create via `createMatch(gameName, { numPlayers, setupData: { expansions } })`, then refresh list.
  * [ ] Seat join:
    * [ ] Per-seat “Join” button calls `joinMatch(gameName, matchID, { playerID, playerName })`.
    * [ ] On success, call `onJoin({ matchID, playerID, credentials, playerName })`.
* [ ] Refactor `App.tsx` to manage screen state:
  * [ ] Default screen is Lobby.
  * [ ] On join: create `Client({ game: BalanceControl, multiplayer: SocketIO({ server }), matchID, playerID, credentials })`.
  * [ ] Start/stop client on screen transitions; subscribe to state updates.
* [ ] Add in-game “Quit game” button:
  * [ ] Calls `LobbyClient.leaveMatch(gameName, matchID, { playerID, credentials })`.
  * [ ] Stops client and returns to Lobby screen on success.
  * [ ] On error: show UI error and keep game running (no silent failures).
* [ ] Add RTL tests for lobby list/create/join/quit using mocked `fetch` (LobbyClient) and minimal client lifecycle assertions.

Notes:

* If any step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] Opening client-web shows Lobby start screen (not the game board).
* [ ] Create match with selected `numPlayers` and `setupData.expansions` succeeds (via Lobby API) and appears in the match list after refresh.
* [ ] Joining a specific seat transitions directly into the game screen and dispatching moves works (client uses `credentials`).
* [ ] “Quit game” calls `leaveMatch` and returns to the Lobby screen.
* [ ] `pnpm -C packages/client-web test` is green.

---

## PR Checklist (Repo Artifact)

This section MUST be completed in this task file before declaring done.

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (if touched)
* [x] `pnpm lint` passes
* [x] `pnpm test` (or `pnpm vitest run`) passes
* [x] Determinism verified (golden replay/state hash)
* [x] No temporary files committed
* [x] `CHANGELOG.md` updated if required

---

## Work Summary (3–7 bullets)

* Added `LobbyScreen` using boardgame.io `LobbyClient` for list/create/join flows.
* Refactored `App` to start in Lobby, then boot a `SocketIO` client with `playerCredentials` after join.
* Added an in-game Quit button that calls Lobby `leaveMatch`, stops the client on success, and returns to Lobby.
* Added RTL tests covering list seats, join transition, and quit/leave flow.
* Updated `CHANGELOG.md` (Unreleased) for the new lobby start screen and quit behavior.

---

## Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm -C packages/client-web test` (pass)
* `pnpm -w lint` (pass)
* `$env:NO_COLOR='1'; pnpm -w test` (pass)
* `git status` (recorded below)
* `git diff --stat` (recorded below)
* `node scripts/verify-task.mjs 0050` (pass)
* `git show -1 --stat` (recorded below)

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
On branch task/0050-client-web-lobby-start-screen
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   CHANGELOG.md
	modified:   docs/tasks/0050-client-web-lobby-start-screen.md
	modified:   packages/client-web/src/App.tsx
	modified:   packages/client-web/src/index.css

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/components/LobbyScreen.tsx
	packages/client-web/test/lobby-screen.test.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 CHANGELOG.md                                     |   1 +
 docs/tasks/0050-client-web-lobby-start-screen.md | 144 ++++++++++++++--
 packages/client-web/src/App.tsx                  | 133 ++++++++++-----
 packages/client-web/src/index.css                | 202 +++++++++++++++++++++++
 4 files changed, 420 insertions(+), 60 deletions(-)
```

### 13.3 Tests

```

> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 61ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 18ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 11ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 15ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 15ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 19ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 27ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/moves.test.ts  (22 tests) 26ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 42ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 34ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 91ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 166ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 9ms
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 15ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 9ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 215ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 6ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/player-view.test.ts  (2 tests) 5ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 5ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  Test Files  22 passed (22)
packages/game test:       Tests  88 passed (88)
packages/game test:    Start at  15:10:08
packages/game test:    Duration  4.57s (transform 4.24s, setup 8ms, collect 24.63s, tests 818ms, environment 7ms, prepare 5.49s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 10ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 9ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 44ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 57ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 65ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 88ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 95ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 128ms
packages/client-web test:  Test Files  8 passed (8)
packages/client-web test:       Tests  24 passed (24)
packages/client-web test:    Start at  15:10:14
packages/client-web test:    Duration  3.13s (transform 595ms, setup 0ms, collect 3.28s, tests 496ms, environment 11.75s, prepare 1.48s)
packages/client-web test: Done
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Sun Feb 15 15:12:46 2026 +0100

    task(0050): add lobby start screen

    - Add LobbyScreen using LobbyClient list/create/join.

    - Refactor App to start in lobby and leave via Quit/leaveMatch.

    - Add RTL tests for lobby join/quit flow and update changelog.

 CHANGELOG.md                                       |   1 +
 docs/tasks/0050-client-web-lobby-start-screen.md   | 152 ++++++++++--
 packages/client-web/src/App.tsx                    | 133 ++++++----
 packages/client-web/src/components/LobbyScreen.tsx | 275 +++++++++++++++++++++
 packages/client-web/src/index.css                  | 202 +++++++++++++++
 packages/client-web/test/lobby-screen.test.tsx     | 174 +++++++++++++
 6 files changed, 874 insertions(+), 63 deletions(-)
```

---

## 15) Amendments (append-only)

N/A
