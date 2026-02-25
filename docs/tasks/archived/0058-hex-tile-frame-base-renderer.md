# Task 0058 - HexTileFrame base renderer (SVG base ring + inner disc + majority fill)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0058-hex-tile-frame-base-renderer`

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

* GR-002: `HexTileFrame` consumes `majoritySeat` as an input prop and only renders presentation; it does not compute majority, legality, costs, modifiers, or any other rules logic.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* UI: UI-HEX-TILE-VISUAL v0.2 (docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml)

---

## 2) Goal

Implement the base HexTile SVG renderer (no overlay PNG, no markers yet):

* Outer hex background fill = influence majority color, else dark gray
* Inner disc (neutral)
* Content placeholder area (resort icon hook, optional W value hook)

This is the foundation for later layers.

---

## 3) Non-Goals

* No overlay PNG in this task.
* No influence markers or badges in this task.
* No engine changes.
* No client-side rules logic (majority is provided by the caller).

---

## 4) Inputs

* `packages/client-web/src/assets/tiles/base_tile.svg`
* `packages/client-web/src/ui/tiles/tileGeometry.ts`
* `docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml`

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/ui/tiles/HexTileFrame.tsx` (new)

### 5.2 Tests

N/A (presentation-only; still run repo tests as postflight proof)

### 5.3 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: client presentation only)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* Canonical viewBox is 747x864.
* No overlay PNG / markers / badges.
* No client legal logic: `majoritySeat` is provided by the caller (selector/UI mapping).

---

## 7) Invariants (Must remain true)

* Client remains presentation-only; no rules logic in client.
* Engine determinism is unaffected (no engine code touched).

---

## 8) Implementation Plan

* [ ] Add `HexTileFrame.tsx` that renders `<svg viewBox="0 0 747 864">` using `tileGeometry` constants.
* [ ] Draw the base hex (from `base_tile.svg` or equivalent extracted geometry) and inner disc circle.
* [ ] Apply majority fill from props: `null -> #0B0B0D`, otherwise `seatColor(majoritySeat)`.
* [ ] Run `pnpm -w lint` and `pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] Frame renders correctly at multiple CSS sizes (e.g., 48px, 96px, 160px height).
* [ ] When `majoritySeat=null`, base fill is `#0B0B0D`.
* [ ] When `majoritySeat=seatX`, base fill matches `seatColor(seatX)`.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] Frame uses canonical viewBox and geometry constants
* [x] No overlay/markers/badges included yet
* [x] No engine code touched
* [x] `pnpm -w lint` passes
* [x] `pnpm -w test` (or `pnpm vitest run`) passes
* [x] No temporary files committed

---

## 11) Work Summary (3-7 bullets)

* Added `HexTileFrame` as the base HexTile SVG renderer (outer hex + inner disc + content placeholder).
* Uses canonical 747x864 tile space via `tileGeometry` constants and the frozen vertex coordinates.
* Applies majority fill strictly from the provided `majoritySeat` prop (presentation-only).

---

## 12) Commands Run (with outcomes)

* `pnpm -w lint` -> ok
* `$env:NO_COLOR=1; pnpm -w test` -> ok

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
On branch task/0058-hex-tile-frame-base-renderer
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0058-hex-tile-frame-base-renderer.md
	new file:   packages/client-web/src/ui/tiles/HexTileFrame.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 docs/tasks/0058-hex-tile-frame-base-renderer.md   | 206 +++++++++++++++++-----
 packages/client-web/src/ui/tiles/HexTileFrame.tsx |  63 +++++++
 2 files changed, 220 insertions(+), 49 deletions(-)
```

### 13.3 Tests

```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 73ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 21ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 25ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 32ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 16ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 16ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 26ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 29ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 22ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 38ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 56ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 49ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 133ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 246ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 10ms
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 17ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 21ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 299ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 12ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 16ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 4ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 4ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  09:00:46
packages/game test:    Duration  5.50s (transform 4.38s, setup 4ms, collect 31.46s, tests 1.17s, environment 11ms, prepare 6.16s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 7ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 5ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 46ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 78ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 94ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 128ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 159ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 105ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 123ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 166ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 184ms
packages/client-web test:  Test Files  11 passed (11)
packages/client-web test:       Tests  32 passed (32)
packages/client-web test:    Start at  09:00:53
packages/client-web test:    Duration  4.32s (transform 907ms, setup 1ms, collect 6.53s, tests 1.09s, environment 23.85s, prepare 3.06s)
packages/client-web test: Done
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Bj?rn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 09:02:52 2026 +0100

    task(0058): add hex tile frame renderer

- Add HexTileFrame base SVG (outer hex + inner disc) with majority fill via props
- Use canonical 747x864 geometry constants (UI-HEX-TILE-VISUAL v0.2)
- Record guardrails, checklist, and postflight proof in task file

 docs/tasks/0058-hex-tile-frame-base-renderer.md   | 323 ++++++++++++++++++----
 packages/client-web/src/ui/tiles/HexTileFrame.tsx |  63 +++++
 2 files changed, 337 insertions(+), 49 deletions(-)
```

---

## 15) Amendments (append-only)
