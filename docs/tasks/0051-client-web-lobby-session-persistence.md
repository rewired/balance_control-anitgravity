# Task 0051 — Client-Web: Lobby Session Persistence (Resume/Leave + Force Forget)

**Date:** 2026-02-15
**Owner:** Codex
**Branch:** `task/0051-client-web-lobby-session-persistence`

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

### compliance_notes (required if affected_guardrails != NONE)

* GR-002: Persistence stores lobby connection/session metadata only; it does not store or compute authoritative game state.
* GR-005: No new engine moves/intents; resume/leave are Lobby API actions only.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

List the exact normative anchors that justify this task.

* ARCH: ARCH-01:CLIENT_RESTRICTIONS

Rule:

* If you cannot cite an anchor for a change → do not implement it.

---

## 2) Goal

Describe the user-visible and/or engine-visible outcome in 2–6 bullets.

* Persist the last joined lobby session (matchID/playerID/credentials/playerName/serverUrl) in `localStorage`.
* Lobby screen shows, when a saved session exists:
  * “Resume last match” (connect to match using stored credentials)
  * “Leave” (call `leaveMatch` using stored credentials)
* If `leaveMatch` fails, show the error and offer “Force forget” (local-only cleanup).

---

## 3) Non-Goals

Explicitly list what this task does NOT do (prevents scope creep).

* Do not implement multiple saved sessions, profiles, accounts, or server-side auth.
* Do not implement auto-resume on load (must show explicit buttons).
* Do not change server behavior or introduce custom endpoints.
* Do not persist or replay engine state.

---

## 4) Inputs

Concrete starting points: files, existing functions, state shape, fixtures.

* Repo areas:

  * `docs/tasks/0050-client-web-lobby-start-screen.md` (Task 0050 outputs assumed complete)
  * `packages/client-web/src/App.tsx` (screen switching and join/leave wiring)
  * `packages/client-web/src/components/LobbyScreen.tsx` (or equivalent from Task 0050)
* Existing behavior summary (current):

  * Joining/leaving works during the session but is lost on refresh/crash because `credentials` are not persisted.

---

## 5) Outputs

Concrete artifacts that must exist after completion.

### 5.1 Code

* Add a small persistence module (e.g. `packages/client-web/src/lobby/session.ts`) that:
  * reads/writes/removes a single “last session” record in `localStorage`
  * validates shape defensively (treat invalid data as absent)
* Update Lobby UI:
  * show “Resume last match” + “Leave” when session exists
  * show errors and “Force forget” when leave fails
* Ensure join flow writes session immediately after successful `joinMatch`.
* Ensure successful leave clears session.

### 5.2 Tests

* Add `packages/client-web/test/lobby-session-persistence.test.tsx` (or extend lobby tests) to assert:
  * session written on join
  * resume uses stored matchID/playerID/credentials
  * leave clears session on success
  * leave failure keeps session and enables force forget

### 5.3 Docs

* [ ] `CHANGELOG.md` updated (Unreleased): persist lobby session + resume/leave.
* [ ] `docs/design-decisions/DD-XXXX-<topic>.md` created (only if ambiguity/conflict) — N/A expected.
* [ ] `docs/rules/ERRATA-XXXX.md` created (only if rule clarification) — N/A.

---

## 6) Constraints (Hard)

* Do not store credentials anywhere except in-memory and `localStorage` (per requirement) — no logs, no analytics.
* “Resume” must be explicit user action (no auto-connect).
* Leave uses boardgame.io Lobby `leaveMatch` only.
* UI-only: persistence does not affect engine determinism/state.

---

## 7) Invariants (Must remain true)

* Client remains presentation-only; no legality computation added.
* No new engine moves or state fields are introduced.
* If storage contains invalid data, lobby behaves as if no session exists.

---

## 8) Implementation Plan

Write the plan as a checklist. Each item should be small and verifiable.

* [ ] Add a typed “last session” helper module:
  * [ ] `readLastSession(): LastSession | null`
  * [ ] `writeLastSession(session: LastSession): void`
  * [ ] `clearLastSession(): void`
  * [ ] Validate the JSON payload shape (strings only; reject otherwise).
* [ ] Wire join flow:
  * [ ] After `joinMatch` success, write session to storage.
* [ ] Lobby UI updates:
  * [ ] If session exists, render a “Resume last match” panel.
  * [ ] Resume button starts game client using stored session (same path as normal join).
  * [ ] Leave button calls `leaveMatch` using stored session, then clears storage on success.
  * [ ] If leave fails, display error + render “Force forget” button that clears storage only.
* [ ] Add/extend RTL tests with mocked `localStorage` and mocked Lobby `fetch`.

Notes:

* If a step reveals ambiguity in specs/contracts, STOP and create a DD doc.

---

## 9) Acceptance Criteria

Write pass/fail criteria; avoid vague language.

* [ ] After joining a seat, refreshing the page shows Lobby with “Resume last match” + “Leave”.
* [ ] Clicking “Resume last match” enters the game screen without re-joining (uses stored credentials).
* [ ] Clicking “Leave” leaves the match (Lobby API), clears saved session, and keeps user on Lobby.
* [ ] If “Leave” fails, session remains and “Force forget” clears local session only.
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

* Added a small `localStorage` persistence helper for the last joined lobby session (defensive shape validation).
* Lobby now renders an explicit â€œResume last matchâ€ panel when a saved session exists.
* Lobby â€œLeaveâ€ calls Lobby `leaveMatch`; on failure shows error and enables â€œForce forgetâ€ local cleanup.
* Join writes the session immediately; successful in-game quit clears the saved session.
* Added RTL coverage for write/resume/leave/force-forget session flows.
* Updated `CHANGELOG.md` (Unreleased).

---

## Commands Run (with outcomes)

Paste exact commands and short outcomes.

* `pnpm -C packages/client-web test` (pass)
* `pnpm lint` (pass)
* `$env:NO_COLOR='1'; pnpm test` (pass)
* `git status` (recorded below)
* `git diff --stat` (recorded below)
* `git show -1 --stat` (recorded below)
* `node scripts/verify-task.mjs 0051` (pass)

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
On branch task/0051-client-web-lobby-session-persistence
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   CHANGELOG.md
	modified:   docs/tasks/0051-client-web-lobby-session-persistence.md
	modified:   packages/client-web/src/App.tsx
	modified:   packages/client-web/src/components/LobbyScreen.tsx
	modified:   packages/client-web/src/index.css
	modified:   packages/client-web/test/lobby-screen.test.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/ui-design/
	packages/client-web/src/lobby/
	packages/client-web/test/lobby-session-persistence.test.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 CHANGELOG.md                                       |  1 +
 .../0051-client-web-lobby-session-persistence.md   |  7 +-
 packages/client-web/src/App.tsx                    | 11 ++-
 packages/client-web/src/components/LobbyScreen.tsx | 82 +++++++++++++++++++++-
 packages/client-web/src/index.css                  | 25 +++++++
 packages/client-web/test/lobby-screen.test.tsx     |  3 +
 6 files changed, 122 insertions(+), 7 deletions(-)
```

### 13.3 Tests

```

> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 60ms
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
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 24ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 16ms
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 14ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 17ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 15ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 20ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 29ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/moves.test.ts  (22 tests) 29ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 43ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 38ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 100ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 182ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 10ms
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 10ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 8ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 267ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 9ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 5ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/player-view.test.ts  (2 tests) 7ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  Test Files  22 passed (22)
packages/game test:       Tests  88 passed (88)
packages/game test:    Start at  15:40:06
packages/game test:    Duration  4.84s (transform 5.04s, setup 3ms, collect 25.50s, tests 924ms, environment 19ms, prepare 6.59s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 6ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 11ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 35ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 62ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 90ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 99ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 131ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 147ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 152ms
packages/client-web test:  Test Files  9 passed (9)
packages/client-web test:       Tests  28 passed (28)
packages/client-web test:    Start at  15:40:12
packages/client-web test:    Duration  3.57s (transform 637ms, setup 2ms, collect 4.21s, tests 733ms, environment 15.57s, prepare 1.88s)
packages/client-web test: Done
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Sun Feb 15 15:44:08 2026 +0100

    task(0051): persist lobby session
    
    - Persist last joined lobby session to localStorage with defensive validation.
    
    - Add Lobby resume/leave UI, including force-forget on leave failures.
    
    - Write session on join and clear it on successful leave (in-lobby or in-game).
    
    - Add RTL tests and update changelog + task file.

 CHANGELOG.md                                       |   1 +
 .../0051-client-web-lobby-session-persistence.md   | 159 ++++++++++++++--
 packages/client-web/src/App.tsx                    |  11 +-
 packages/client-web/src/components/LobbyScreen.tsx |  82 ++++++++-
 packages/client-web/src/index.css                  |  25 +++
 packages/client-web/src/lobby/session.ts           |  70 +++++++
 packages/client-web/test/lobby-screen.test.tsx     |   3 +
 .../test/lobby-session-persistence.test.tsx        | 205 +++++++++++++++++++++
 8 files changed, 534 insertions(+), 22 deletions(-)
```

---

## 15) Amendments (append-only)

N/A
