# Task 0065 - Tests: RTL smoke for HexTileVisual (render matrix)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0065-rtl-smoke-tests-hex-tile-visual`

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

* GR-002: Tests exercise `HexTileVisual` as a presentation component only; they do not assert legality, costs, majority, modifiers, or production rules (engine-only).
* GR-014: Tests treat the tile visual layering and badge layout selection as stable presentation behavior (no changes to icon mapping).

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

Add lightweight, real tests to prevent regressions:

* `HexTileVisual` renders without crashing
* hover/selected toggles influence marker visibility
* overlay layer mounts
* badge layout mode switches (compact vs belt)

---

## 3) Non-Goals

* No engine changes.
* No engine rule tests.
* No snapshots unless already standard in the repo.

---

## 4) Inputs

* `packages/client-web/src/ui/tiles/HexTileVisual.tsx` (Task 0062)
* `packages/client-web/src/ui/tiles/InfluenceCorners.tsx`
* `packages/client-web/src/ui/tiles/BadgeSlots.tsx`

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx` (new)

Minimum cases:

1) Render with `majoritySeat=null`, no badges, no markers.
2) Render with `majoritySeat=1`, `hover=false selected=false` => marker layer hidden.
3) Render with `hover=true` => marker layer visible and includes numbers.
4) Render with `metaIconsBySeat` for one seat => capsule expands (assert via `<rect>` presence and width).
5) Badges:
   * 2 badges => compact mode (2 slots used)
   * 4 badges => belt mode (4 slots used)

### 5.2 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: tests only)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Do not test engine logic.
* Keep tests fast.

---

## 7) Invariants (Must remain true)

* Use robust queries (avoid DOM-order assumptions beyond what is required).
* Reference canonical component props and shared constants when asserting geometry/layout.

---

## 8) Implementation Plan

* [ ] Add RTL tests for `HexTileVisual` covering marker visibility, overlay mount, and badge mode switch.
* [ ] Keep assertions stable (no brittle snapshots).
* [ ] Run `pnpm -w lint` and `$env:NO_COLOR=1; pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] Tests pass locally.
* [ ] Tests fail if marker visibility breaks.
* [ ] Tests fail if badge mode switching breaks.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Tests are deterministic and stable
* [x] No engine packages touched
* [x] `pnpm -w lint` passes
* [x] `pnpm -w test` passes
* [x] Determinism verified (N/A: UI-only tests)
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Add RTL smoke tests for `HexTileVisual` covering overlay mount, marker visibility toggles, capsule expansion, and badge layout mode switching.
* Keep assertions geometry-driven (canonical constants) and avoid brittle snapshots.

---

## 12) Commands Run (exact)

* `pnpm -w lint` (pass)
* `$env:NO_COLOR=1; pnpm -w test` (pass)
* `git status`
* `git diff --stat`

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
On branch task/0065-rtl-smoke-tests-hex-tile-visual
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0065-rtl-smoke-tests-hex-tile-visual.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/ui/tiles/__tests__/

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 docs/tasks/0065-rtl-smoke-tests-hex-tile-visual.md | 178 ++++++++++++++++-----
 1 file changed, 142 insertions(+), 36 deletions(-)
```

### 13.3 lint

```
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
```

### 13.4 tests

```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 63ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 30ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 26ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 37ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 38ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 40ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 21ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 28ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 21ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 28ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 53ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 41ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 120ms
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
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 212ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 16ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 246ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 8ms
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 13ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 18ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 10ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 6ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 5ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  10:53:30
packages/game test:    Duration  4.95s (transform 4.25s, setup 2ms, collect 26.70s, tests 1.08s, environment 8ms, prepare 6.14s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 6ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 12ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 47ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (5 tests) 105ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 75ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 74ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 63ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 89ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 103ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 119ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 158ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 158ms
packages/client-web test:  Test Files  12 passed (12)
packages/client-web test:       Tests  37 passed (37)
packages/client-web test:    Start at  10:53:36
packages/client-web test:    Duration  3.98s (transform 890ms, setup 3ms, collect 7.28s, tests 1.01s, environment 24.18s, prepare 3.05s)
packages/client-web test: Done
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 10:55:15 2026 +0100

    task(0065): add RTL smoke tests for hex tile visual

- Add deterministic RTL smoke coverage for HexTileVisual render matrix

- Assert marker visibility, capsule expansion, overlay mount, and badge layout mode switching

- Keep tests presentation-only and geometry-driven (no engine logic)

 docs/tasks/0065-rtl-smoke-tests-hex-tile-visual.md | 328 ++++++++++++++++++---
 .../tiles/__tests__/HexTileVisual.smoke.test.tsx   | 111 ++++++++
 2 files changed, 403 insertions(+), 36 deletions(-)
```

---

## 15) Amendments (append-only)
