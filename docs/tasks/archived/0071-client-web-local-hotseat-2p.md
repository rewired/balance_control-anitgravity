# Task 0071 - Client-Web: Local hotseat (2p) mode with seat switch (playable end-to-end)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0071-client-web-local-hotseat-2p`

---

**Task State:** DONE

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

### compliance_notes

* GR-002: Hotseat UI must not implement new rules logic. All legality comes from `enumerateLegalIntents` and existing selectors. No duplicated legality, costs, or prohibitions in client code.
* GR-004: Use only existing, maintained runtime dependencies. Prefer boardgame.io built-ins; no bespoke networking.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* AGENTS: repo goal includes hotseat play (single device)
* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)

---

## 2) Goal

Enable a fully playable local hotseat match for **2 players** in the web client:

* start a local match without running the server
* switch the displayed seat (P0 <-> P1) via UI
* play turns end-to-end using the existing stage + legal intent system

This is the shortest path to "two people can finish a game on one screen".

---

## 3) Non-Goals

* No engine/rules changes.
* No online multiplayer changes (SocketIO path remains intact).
* No new UI polish beyond what is required to play (no redesign, no new art).

---

## 4) Inputs

Existing client entry / lobby flow:

* `packages/client-web/src/App.tsx`
* `packages/client-web/src/components/LobbyScreen.tsx`

Existing game client bindings:

* `packages/client-web/src/Board.tsx` (Boardgame.io client wrapper usage)
* `@balance-control/game` exports `BalanceControl`, `enumerateLegalIntents`

Existing UI that must continue to work:

* `packages/client-web/src/components/GameLayout.tsx`
* `packages/client-web/src/components/BoardViewport.tsx`
* `packages/client-web/src/components/ActionPanel.tsx`

---

## 5) Outputs

### 5.1 Code

A) Add a local-hotseat bootstrap that creates a local 2p match using boardgame.io local multiplayer transport.

* Add: `packages/client-web/src/hotseat/HotseatShell.tsx`
  - Holds exactly two seat clients (playerID "0" and "1") connected to the same local match
  - Renders exactly one seat at a time based on an `activeSeat` state
  - Exposes "Switch seat" UI (two buttons or a toggle), visible at all times in hotseat mode
  - Shows a small status label: currentPlayer + activeSeat (debug clarity)

B) Add a simple way to enter hotseat mode (temporary entry is OK for this task).

One of the following is acceptable (pick exactly one):

* Option 1 (route-ish): `/?mode=hotseat`
* Option 2 (button): add "Local hotseat (2p)" button to `LobbyScreen` that switches App into hotseat mode

C) Keep existing online lobby unchanged and still reachable.

### 5.2 Tests

Add at least one minimal client-web test that proves the hotseat shell renders and seat switching does not crash.

* Suggested location: `packages/client-web/src/hotseat/__tests__/HotseatShell.smoke.test.tsx`

Test must be stable (no timing flakiness).

### 5.3 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `CHANGELOG.md` updated (only if user-visible entry is warranted; otherwise mark N/A)
* [ ] `/docs/design-decisions/DD-XXXX-hotseat-mode.md` created (N/A if implemented using boardgame.io Local transport without new rules)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Hotseat mode must not require `packages/server` running.
* No engine code changes in this task.
* No duplicate legality logic in the client:

  * Hotseat uses the same `GameLayout` and existing `enumerateLegalIntents` flow.

* Seat switching must not expose hidden information:

  * When seat = P0 is active, render the P0 playerView; when seat = P1, render the P1 playerView.

---

## 7) Invariants (Must remain true)

* Online lobby path remains functional.
* Determinism is unchanged (hotseat is presentation-only; rules still in `@balance-control/game`).
* No new cross-package source imports (client-web must not import `packages/game/src/*` directly).

---

## 8) Implementation Plan

* [ ] Implement `HotseatShell` that creates two local boardgame.io clients for the same match and toggles which one is rendered.
* [ ] Add a minimal entry path into hotseat mode (query param or button).
* [ ] Add a stable smoke test for the shell + seat switch.
* [ ] Run workspace lint + tests.

---

## 9) Acceptance Criteria

* [ ] With server OFF, user can start hotseat 2p mode in the browser and see a playable game UI.
* [ ] Seat switch toggles between P0 and P1 views without errors.
* [ ] Player turn gating is correct (only the currentPlayer seat has interactive controls).
* [ ] `pnpm -w lint` passes.
* [ ] `$env:NO_COLOR=1; pnpm -w test` passes.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Hotseat mode starts without server
* [x] Seat switch UI works and is stable
* [x] No rules/engine changes
* [x] No cross-package source imports added
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Added local 2-player hotseat shell with seat switching and status label.
* Added hotseat entry via query param `/?mode=hotseat` (online lobby unchanged).
* Added a stable smoke test for render + seat switching.

---

## 12) Commands Run (exact)

* `pnpm -w lint` (pass)
* `$env:NO_COLOR=1; pnpm -w test` (pass)
* `git status` (see Proof)
* `git diff --stat` (see Proof)
* `git switch -c task/0071-client-web-local-hotseat-2p` (success)
* `git add docs/tasks/0071-client-web-local-hotseat-2p.md packages/client-web/src/App.tsx packages/client-web/src/hotseat/HotseatShell.tsx packages/client-web/test/hotseat-shell.smoke.test.tsx`
* `git commit -m "task(0071): add local hotseat 2p mode" -m "- Add HotseatShell with two local seat clients and seat switch UI" -m "- Add /?mode=hotseat entry + smoke test to prevent regressions"` (success)
* `git commit --amend --no-edit` (success; includes final task file updates)
* `git show -1 --stat` (pass)
* `git status -sb` (pass)

---

## 13) Proof (screenshots / logs)

### git status

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0071-client-web-local-hotseat-2p.md
	modified:   packages/client-web/src/App.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/hotseat/
	packages/client-web/test/hotseat-shell.smoke.test.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### git diff --stat

```text
 docs/tasks/0071-client-web-local-hotseat-2p.md |  8 ++++----
 packages/client-web/src/App.tsx                | 19 ++++++++++++++++++-
 2 files changed, 22 insertions(+), 5 deletions(-)
```

### pnpm -w lint

```text
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
```

### $env:NO_COLOR=1; pnpm -w test

```text
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 91ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 28ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 54ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 2553ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 2559ms
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 17ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 21ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 27ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 27ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 34ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 56ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 48ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test:  ✓ test/turn.test.ts  (9 tests) 136ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 262ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 12ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 9ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 12ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 310ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 17ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 11ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 4ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 5ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  15:04:30
packages/game test:    Duration  5.99s (transform 7.01s, setup 6ms, collect 36.83s, tests 6.31s, environment 9ms, prepare 7.14s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 6ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 30ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 54ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 98ms
packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 66ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 127ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 95ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 82ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 142ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 148ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 175ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 217ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 223ms
packages/client-web test:  Test Files  13 passed (13)
packages/client-web test:       Tests  42 passed (42)
packages/client-web test:    Start at  15:04:37
packages/client-web test:    Duration  5.05s (transform 1.63s, setup 6ms, collect 11.08s, tests 1.46s, environment 33.61s, prepare 4.58s)
packages/client-web test: Done
```

---

## 14) Commit Message

Required format:

* Subject: `task(0071): <summary>`
* Body: at least 2 bullet lines, e.g.

  - `- ...`
  - `- ...`

Planned:

* Subject: `task(0071): add local hotseat 2p mode`
* Body:
  - `- Add HotseatShell with two local seat clients and seat switch UI`
  - `- Add /?mode=hotseat entry + smoke test to prevent regressions`

---

## 15) Amendments (append-only)

* 2026-02-16: Section 5.3 Docs items are N/A for this task (no changelog, DD, or errata required). Sections 8/9/5.3 checkboxes remain unchecked by design per freeze protocol; completion is recorded in Section 10 + Section 13.
