# Task 0061 - GlassOverlay layer (PNG in SVG, 748x865 -> 747x864)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0061-glass-overlay-png-layer`

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

### compliance_notes

* GR-002: Glass overlay is a presentation-only SVG layer; it does not compute legality, costs, majority, modifiers, production, or any other rules logic.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* UI: UI-HEX-TILE-VISUAL v0.2 (`docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml`) -> `overlay_png`

---

## 2) Goal

Add the PNG glass overlay as an SVG `<image>` layer:

* PNG source is 748x865
* Render into tile space rect `0,0,747,864` with `preserveAspectRatio="none"`
* Markers and badges MUST remain above this layer (z-order)

---

## 3) Non-Goals

* No engine changes.
* No markers/badges added here.
* No additional filters/effects.

---

## 4) Inputs

* `packages/client-web/src/assets/tiles/tile-overlay.png`
* `packages/client-web/src/ui/tiles/tileGeometry.ts`
* `packages/client-web/src/ui/tiles/HexTileFrame.tsx` (Task 0058)
* `docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml`

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/ui/tiles/GlassOverlay.tsx` (new)
* `packages/client-web/src/ui/tiles/HexTileFrame.tsx` (insert L3 overlay)

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

* Import PNG as URL (Vite static asset).
* Render rect MUST be exactly `x=0 y=0 width=747 height=864 preserveAspectRatio="none"`.
* Overlay must render above tile content and below markers/badges (z-order).
* No engine changes.

---

## 7) Invariants (Must remain true)

* Overlay render rect matches UI-HEX-TILE-VISUAL v0.2 exactly (no recomputation).
* Tile SVG root keeps `overflow: visible`; overlay itself stays within viewBox.

---

## 8) Implementation Plan

* [ ] Add `GlassOverlay.tsx` that renders the `<image>` with exact rect and preserveAspectRatio.
* [ ] Insert overlay into `HexTileFrame` at layer L3 (above content, below markers/badges).
* [ ] Run `pnpm -w lint` and `pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] Overlay appears aligned with base tile across multiple tile sizes.
* [ ] No clipping (tile SVG allows overflow visible; overlay itself stays within viewBox).
* [ ] Z-order ensures markers/badges render above overlay.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] PNG is rendered with exact rect and preserveAspectRatio="none"
* [x] Z-order ensures markers/badges render above overlay
* [x] No engine packages touched
* [x] `pnpm -w lint` passes
* [x] `pnpm -w test` (or `pnpm vitest run`) passes
* [x] No temporary files committed

---

## 11) Work Summary (3-7 bullets)

* Added `GlassOverlay` SVG layer that renders `tile-overlay.png` into the exact tile-space rect from UI-HEX-TILE-VISUAL v0.2.
* Updated `HexTileFrame` layering to render `content` below the glass overlay and render `children` above it (markers/badges stay on top).
* Kept change presentation-only (no engine logic touched).

---

## 12) Commands Run (with outcomes)

* `pnpm -w lint` -> ok
* `$env:NO_COLOR=1; pnpm -w test` -> ok

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
On branch task/0061-glass-overlay-png-layer
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0061-glass-overlay-png-layer.md
	modified:   packages/client-web/src/ui/tiles/HexTileFrame.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/ui/tiles/GlassOverlay.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 docs/tasks/0061-glass-overlay-png-layer.md        | 180 +++++++++++++++++-----
 packages/client-web/src/ui/tiles/HexTileFrame.tsx |   8 +-
 2 files changed, 148 insertions(+), 40 deletions(-)
```

### 13.3 tests

```

> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 106ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 20ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 16ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 23ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 20ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 22ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 26ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 29ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 21ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 34ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 57ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 48ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test:  ✓ test/turn.test.ts  (9 tests) 135ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 324ms
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 9ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 22ms
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 20ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 328ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 22ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 24ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 10ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 7ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  09:42:13
packages/game test:    Duration  6.63s (transform 6.42s, setup 1ms, collect 36.61s, tests 1.33s, environment 7ms, prepare 7.63s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 8ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 18ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 61ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 168ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 168ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 89ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 99ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 191ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 63ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 212ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 74ms
packages/client-web test:  Test Files  11 passed (11)
packages/client-web test:       Tests  32 passed (32)
packages/client-web test:    Start at  09:42:21
packages/client-web test:    Duration  4.83s (transform 1.08s, setup 2ms, collect 7.25s, tests 1.15s, environment 26.41s, prepare 3.55s)
packages/client-web test: Done
```

### 13.4 git status (after commit)

```
On branch task/0061-glass-overlay-png-layer
nothing to commit, working tree clean
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 09:44:08 2026 +0100

    task(0061): add glass overlay PNG layer

- Add GlassOverlay SVG <image> rendering tile-overlay.png into 0,0,747,864 with preserveAspectRatio=none

- Insert overlay into HexTileFrame as L3 (content below, markers/badges above)

- Update task 0061 doc with checklist, commands, and postflight proof

 docs/tasks/0061-glass-overlay-png-layer.md        | 328 +++++++++++++++++++---
 packages/client-web/src/ui/tiles/GlassOverlay.tsx |  17 ++
 packages/client-web/src/ui/tiles/HexTileFrame.tsx |   8 +-
 3 files changed, 313 insertions(+), 40 deletions(-)
```

---

## 15) Amendments (append-only)
