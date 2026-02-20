# Task 0060 - BadgeSlots (compact vs belt) fixed positions + rotations

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0060-badge-slots-compact-vs-belt`

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
* GR-014

### compliance_notes

* GR-002: `BadgeSlots` renders from passed-in props only; it does not compute legality, costs, majority, modifiers, production, or any other rules logic.
* GR-014: Badge slot centers/rotations are copied from the normative UI contract and treated as stable presentation-only behavior.

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

Implement tile badges in **fixed slots**:

* If badgeCount <= 2: use compact slots (TL_T then T_TR)
* If badgeCount > 2: use belt slots (6 edges)
* Each slot has fixed center + rotation angle from the spec

Badges are a UI overlay layer that MUST be above the glass overlay later.

---

## 3) Non-Goals

* No engine changes.
* No client-side rules logic.
* No CSS filter effects / glows.

---

## 4) Inputs

* `packages/client-web/src/ui/tiles/tileGeometry.ts`
* `docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml`

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/ui/tiles/BadgeSlots.tsx` (new)

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
* Slots chosen deterministically by `badges.length` (<=2 compact, >2 belt).
* Render badges in stable order (input array order) into slot order.
* If more badges than slots: render up to `slots.length` (ignore the rest, deterministic).
* No CSS filters / glow spam.

---

## 7) Invariants (Must remain true)

* Slot centers and rotations come from `BADGE_SLOTS` and match UI-HEX-TILE-VISUAL v0.2 exactly (no runtime derivation).
* Badge shapes use `BADGE_SIZE` and `BADGE_CORNER_RADIUS` constants.

---

## 8) Implementation Plan

* [ ] Add `BadgeSlots.tsx` overlay that renders badges into fixed slots using `tileGeometry` constants.
* [ ] Choose slots by `badges.length` and render in stable order (slice to slot count).
* [ ] Keep rendering deterministic and presentation-only.
* [ ] Run `pnpm -w lint` and `pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] With 0 badges: renders nothing.
* [ ] With 1-2 badges: uses compact slots only.
* [ ] With 3+ badges: uses belt slots.
* [ ] Slots have fixed centers + rotations from the spec.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] Slot mapping matches spec exactly
* [x] Deterministic ordering (no random layout)
* [x] No engine packages touched
* [x] `pnpm -w lint` passes
* [x] `pnpm -w test` (or `pnpm vitest run`) passes
* [x] No temporary files committed

---

## 11) Work Summary (3-7 bullets)

* Added `BadgeSlots` SVG overlay that renders tile badges into fixed slot centers + rotations per UI-HEX-TILE-VISUAL v0.2.
* Slot selection is deterministic by badge count (<=2 compact, >2 belt), and rendering order is stable (input order into slot order).
* Badge shape uses the canonical size + corner radius constants from `tileGeometry` (no runtime derivation).

---

## 12) Commands Run (with outcomes)

* `pnpm -w lint` -> ok
* `$env:NO_COLOR=1; pnpm -w test` -> ok

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
On branch task/0060-badge-slots-compact-vs-belt
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0060-badge-slots-compact-vs-belt.md
	new file:   packages/client-web/src/ui/tiles/BadgeSlots.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 docs/tasks/0060-badge-slots-compact-vs-belt.md  | 191 ++++++++++++++++++------
 packages/client-web/src/ui/tiles/BadgeSlots.tsx |  75 ++++++++++
 2 files changed, 218 insertions(+), 48 deletions(-)
```

### 13.3 tests

`$env:NO_COLOR=1; pnpm -w test`

```

> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 79ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 33ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 28ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 32ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 14ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 16ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 21ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 16ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 23ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 33ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 55ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 47ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 126ms
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
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 231ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 23ms
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 14ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 8ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 293ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 16ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 5ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 5ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  09:31:14
packages/game test:    Duration  5.49s (transform 4.54s, setup 1ms, collect 29.61s, tests 1.14s, environment 6ms, prepare 6.38s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 23ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 21ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 59ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 107ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 132ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 64ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 78ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 86ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 83ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 199ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 214ms
packages/client-web test:  Test Files  11 passed (11)
packages/client-web test:       Tests  32 passed (32)
packages/client-web test:    Start at  09:31:21
packages/client-web test:    Duration  4.63s (transform 1.07s, setup 2ms, collect 7.54s, tests 1.07s, environment 26.23s, prepare 3.06s)
packages/client-web test: Done
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 09:33:27 2026 +0100

    task(0060): add badge slots overlay

- Add BadgeSlots SVG overlay with fixed centers/rotations (UI-HEX-TILE-VISUAL v0.2)

- Choose compact vs belt slots deterministically by badge count

- Render badges in stable input order into slot order with tone fills

 docs/tasks/0060-badge-slots-compact-vs-belt.md  | 329 ++++++++++++++++++++----
 packages/client-web/src/ui/tiles/BadgeSlots.tsx |  75 ++++++
 2 files changed, 356 insertions(+), 48 deletions(-)
```

---

## 15) Amendments (append-only)
