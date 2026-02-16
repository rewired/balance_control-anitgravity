# Task 0064 - Viewport stability pass (pan/zoom + crispness safeguards)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0064-viewport-stability-pass`

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
* GR-014

### compliance_notes

* GR-002: This task adjusts viewport/tile container CSS and event handling only. No client-side legality/cost/majority/prod logic is introduced.
* GR-014: No icon mapping changes are introduced. Any pointer-event changes apply only to interaction stability (not icon selection).

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* UI: UI-HEX-TILE-VISUAL v0.2 (`docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml`)

---

## 2) Goal

Ensure the new `HexTileVisual` rendering remains stable under pan/zoom:

* avoid clipping (protruding markers/badges)
* avoid hover flicker when crossing protruding visuals
* reduce blur artifacts where practical

This is a stability pass only; do not redesign visuals.

---

## 3) Non-Goals

* No engine changes.
* No new mechanics.
* Do not replace the pan/zoom library (`react-zoom-pan-pinch`) if already installed and working.

---

## 4) Inputs

* `packages/client-web/src/components/BoardViewport.tsx`
* `packages/client-web/src/components/HexBoard.tsx`
* `packages/client-web/src/index.css`
* `HexTileVisual` already integrated (Task 0063)

---

## 5) Outputs

### 5.1 Code

* Update CSS / container setup as needed:
  * Ensure immediate tile container and board layers do not apply `overflow: hidden` in a way that clips protruding markers.
  * Ensure marker and badge layers use `pointer-events: none` where appropriate (no interaction capture).
  * Add safe performance hints:
    * `will-change: transform` on the pan/zoom transform content element
    * avoid unnecessary CSS filters on tiles

### 5.2 Tests

N/A (presentation-only; still run repo tests as postflight proof)

### 5.3 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: no logic/state/resolver changes)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* No engine changes.
* No new mechanics.

---

## 7) Invariants (Must remain true)

* Board transforms remain deterministic and purely presentational.
* Tile SVG remains canonical viewBox.

---

## 8) Implementation Plan

* [ ] Remove/avoid `overflow: hidden` in board viewport layers that can clip protruding markers.
* [ ] Add `will-change: transform` and related safe hints to the pan/zoom content container.
* [ ] Add a small, deterministic hit-safety margin so hover does not flicker when crossing protruding markers/badges.
* [ ] Ensure marker/badge layers remain `pointer-events: none` (no interaction capture).
* [ ] Run `pnpm -w lint` and `$env:NO_COLOR=1; pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] No marker clipping during pan/zoom (within normal viewport usage).
* [ ] Hover does not flicker when cursor crosses protruding markers/badges.
* [ ] Zoomed board remains usable; visuals remain consistent.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed + complied
* [x] No pan/zoom regression
* [x] No clipping regressions
* [x] No hover flicker regression
* [x] No engine packages touched
* [x] `pnpm -w lint` passes
* [x] `pnpm -w test` passes
* [x] Determinism verified (N/A: UI-only)
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Make the board viewport and pan/zoom layers overflow-safe for protruding tile markers/badges.
* Add transform performance hints (`will-change`) on the pan/zoom content container.
* Add a small hover/selection hit-safety margin so hover does not flicker when crossing protruding visuals.
* Ensure badge layers remain non-interactive (`pointer-events: none`).

---

## 12) Commands Run (exact)

* `pnpm -w lint` (pass)
* `$env:NO_COLOR=1; pnpm -w test` (pass)
* `git status`
* `git diff --stat`

---

## 13) Postflight Proof (copy/paste output)

After implementation, paste:

### 13.1 git status

```txt
On branch task/0064-viewport-stability-pass
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0064-viewport-stability-pass.md
	modified:   packages/client-web/src/components/HexBoard.tsx
	modified:   packages/client-web/src/index.css
	modified:   packages/client-web/src/ui/tiles/BadgeSlots.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```txt
 docs/tasks/0064-viewport-stability-pass.md      | 214 +++++++++++++++++++-----
 packages/client-web/src/components/HexBoard.tsx |  17 +-
 packages/client-web/src/index.css               |  17 +-
 packages/client-web/src/ui/tiles/BadgeSlots.tsx |   3 +-
 4 files changed, 200 insertions(+), 51 deletions(-)
```

### 13.3 tests

```txt

> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 75ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 25ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 14ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 17ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 40ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 15ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 20ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 28ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 29ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 32ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 65ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 53ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/turn.test.ts  (9 tests) 144ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 253ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 10ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 15ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 17ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 17ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 16ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 336ms
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 5ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 6ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  10:31:55
packages/game test:    Duration  5.66s (transform 5.51s, setup 4ms, collect 32.95s, tests 1.24s, environment 8ms, prepare 6.52s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 6ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 18ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 49ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 85ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 81ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 100ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 125ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 150ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 135ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 195ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 198ms
packages/client-web test:  Test Files  11 passed (11)
packages/client-web test:       Tests  32 passed (32)
packages/client-web test:    Start at  10:32:02
packages/client-web test:    Duration  4.17s (transform 844ms, setup 3ms, collect 7.10s, tests 1.14s, environment 22.75s, prepare 2.83s)
packages/client-web test: Done
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```txt
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 10:34:03 2026 +0100

    task(0064): viewport stability pass

- Prevent marker/badge clipping by making viewport layers overflow-safe

- Add transform performance hints on pan/zoom content

- Add a small hover hit-safety margin to avoid flicker

- Keep markers/badges non-interactive via pointer-events

 docs/tasks/0064-viewport-stability-pass.md      | 343 +++++++++++++++++++++---
 packages/client-web/src/components/HexBoard.tsx |  17 +-
 packages/client-web/src/index.css               |  17 +-
 packages/client-web/src/ui/tiles/BadgeSlots.tsx |   3 +-
 4 files changed, 329 insertions(+), 51 deletions(-)
```

---

## 15) Amendments (append-only)
