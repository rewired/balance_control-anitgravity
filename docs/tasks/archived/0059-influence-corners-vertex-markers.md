# Task 0059 - InfluenceCorners (vertex markers + hover/selected reveal + radial capsule expand)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0059-influence-corners-vertex-markers`

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

* GR-002: `InfluenceCorners` renders from passed-in props only; it does not compute legality, costs, majority, modifiers, production, or any other rules logic.
* GR-014: Marker geometry and capsule sizing are copied from the normative UI contract and treated as stable presentation-only behavior.

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

Render the influence corner markers exactly per UI-HEX-TILE-VISUAL v0.2:

* Marker centers are EXACTLY on the hex vertices (seat1..seat6).
* Markers are hidden when not hovered/selected.
* When visible: show influence number + ALL meta icons.
* If `metaCount > 0`: expand marker into capsule outward (radial).

---

## 3) Non-Goals

* No engine changes.
* No client-side rules logic (legality/costs/majority/modifiers remain engine-only).
* No hover handling logic inside markers (marker layer is `pointer-events: none`).

---

## 4) Inputs

* `packages/client-web/src/ui/tiles/tileGeometry.ts`
* `docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml`

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/ui/tiles/InfluenceCorners.tsx` (new)
* `packages/client-web/src/ui/tiles/HexTileFrame.tsx` (update: tile root overflow visible)
* `packages/client-web/src/ui/tiles/tileGeometry.ts` (update: capsule sizing constants)

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
* Marker layer MUST have `pointer-events: none` (avoid hover flicker).
* Tile root MUST allow overflow visible (markers can extend beyond viewBox).
* Marker visibility: `isHovered || isSelected`.
* Capsule orientation: along outward radial direction (center -> vertex).

---

## 7) Invariants (Must remain true)

* Marker centers are from `INFLUENCE_MARKER_CENTERS_ABS` (no offsets/insets).
* Marker radius and stroke width come from `tileGeometry` constants (spec v0.2).
* Capsule width uses the spec formula (label gap + icon size + icon gap).
* Text uses tabular numbers if possible (`font-variant-numeric: tabular-nums`).

---

## 8) Implementation Plan

* [ ] Add `InfluenceCorners.tsx` that renders the marker layer from props.
* [ ] Use `INFLUENCE_MARKER_CENTERS_ABS` directly for centers; compute capsule rotation from `CENTER_ABS -> vertex`.
* [ ] Implement capsule expansion with the spec sizing formula and render all meta icons (no summary).
* [ ] Ensure HexTile root overflow is visible.
* [ ] Run `pnpm -w lint` and `pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] Non-hover + non-selected: marker layer is not visible.
* [ ] Hover or selected: marker shows for each seat that has influence or meta icons.
* [ ] Meta icons: render ALL icons (no "+" summary) and capsule width matches the spec formula.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] Marker centers are exactly on vertices (no inset)
* [x] `pointer-events` disabled on marker layer
* [x] Capsule expansion and rotation are correct
* [x] No engine packages touched
* [x] `pnpm -w lint` passes
* [x] `pnpm -w test` (or `pnpm vitest run`) passes
* [x] No temporary files committed

---

## 11) Work Summary (3-7 bullets)

* Added `InfluenceCorners` SVG layer that renders vertex-centered influence markers from props only.
* Implements hover/selected visibility gate and disables pointer events to avoid hover flicker.
* Adds capsule expansion (radial) with spec sizing for meta icon count and renders all meta icons.
* Ensures tile root SVG allows overflow visible so markers can extend beyond the viewBox.

---

## 12) Commands Run (with outcomes)

* `pnpm -w lint` -> ok
* `$env:NO_COLOR=1; pnpm -w test` -> ok

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
On branch task/0059-influence-corners-vertex-markers
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0059-influence-corners-vertex-markers.md
	modified:   packages/client-web/src/ui/tiles/HexTileFrame.tsx
	new file:   packages/client-web/src/ui/tiles/InfluenceCorners.tsx
	modified:   packages/client-web/src/ui/tiles/tileGeometry.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 .../tasks/0059-influence-corners-vertex-markers.md | 213 ++++++++++++++++-----
 packages/client-web/src/ui/tiles/HexTileFrame.tsx  |   7 +-
 .../client-web/src/ui/tiles/InfluenceCorners.tsx   | 136 +++++++++++++
 packages/client-web/src/ui/tiles/tileGeometry.ts   |   6 +-
 4 files changed, 307 insertions(+), 55 deletions(-)
```

### 13.3 tests

```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 86ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 21ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 25ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 29ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 19ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 19ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 22ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 25ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 30ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 39ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 64ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 81ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/turn.test.ts  (9 tests) 146ms
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 298ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 318ms
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 10ms
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 15ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 17ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 15ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 5ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 5ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  09:18:34
packages/game test:    Duration  5.73s (transform 4.67s, setup 3ms, collect 39.75s, tests 1.31s, environment 7ms, prepare 6.82s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 7ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 10ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 53ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 126ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 143ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 84ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 83ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 92ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 75ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 194ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 203ms
packages/client-web test:  Test Files  11 passed (11)
packages/client-web test:       Tests  32 passed (32)
packages/client-web test:    Start at  09:18:41
packages/client-web test:    Duration  4.38s (transform 915ms, setup 1ms, collect 6.41s, tests 1.07s, environment 25.38s, prepare 3.01s)
packages/client-web test: Done
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 09:21:06 2026 +0100

    task(0059): add influence corner markers

- Add InfluenceCorners SVG layer with vertex-centered markers
- Implement hover/selected reveal and pointer-events none
- Add radial capsule expansion sizing for meta icons
- Make tile root overflow visible

 .../tasks/0059-influence-corners-vertex-markers.md | 344 +++++++++++++++++----
 packages/client-web/src/ui/tiles/HexTileFrame.tsx  |   7 +-
 .../client-web/src/ui/tiles/InfluenceCorners.tsx   | 136 ++++++++
 packages/client-web/src/ui/tiles/tileGeometry.ts   |   6 +-
 4 files changed, 438 insertions(+), 55 deletions(-)
```

---

## 15) Amendments (append-only)
