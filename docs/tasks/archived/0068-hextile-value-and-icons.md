# Task 0068 - HexTile value placement + resort icons (SVG)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0068-hextile-value-and-icons`

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

* GR-002: Client-only rendering change in `packages/client-web`; no legality/cost/majority/modifier computation is added to the client.
* GR-014: Update uses existing icon assets and keeps mapping limited to DOM/INF/FOR; no changes to the stable presentation contract beyond rendering those existing icons.

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

Align HexTile content visuals with the simulator contract:

1) Produced value (weight) rendering
* If present: centered.
* Positioned 10px above center.
* Font size: 130px.
* Render ONLY the number (no "W" prefix).

2) Resort icons
* Use existing SVG assets for DOM/INF/FOR.
* Render as an SVG `<image>` in the content layer.

---

## 3) Non-goals

* No new icons for other tile types (Hotspot, Grassroots, etc.) in this task.
* No changes to influence marker rules.

---

## 4) Inputs

* HexTile visual:
  * `/packages/client-web/src/ui/tiles/HexTileVisual.tsx`
* Board rendering:
  * `/packages/client-web/src/components/HexBoard.tsx`
* Existing icon assets:
  * `/packages/client-web/src/assets/tile-icons/dom.svg`
  * `/packages/client-web/src/assets/tile-icons/inf.svg`
  * `/packages/client-web/src/assets/tile-icons/for.svg`

---

## 5) Outputs

### 5.1 Code

A) HexTileVisual value placement

* Update `/packages/client-web/src/ui/tiles/HexTileVisual.tsx`
  * Remove the "W" prefix.
  * Move weight text to `y = CENTER_ABS[1] - 10`.
  * Set font size to `130`.

B) Resort icon helper

* Add `/packages/client-web/src/ui/tiles/ResortIcon.tsx`

Requirements:

* Input: resort string ("DOM" | "INF" | "FOR" | undefined)
* Output: SVG `<image>` node (or null)
* Use Vite URL imports for SVG (no SVGR plugin required).

C) Wire icons into HexBoard

* Update `/packages/client-web/src/components/HexBoard.tsx`
  * Pass `resortIcon={<ResortIcon resort={tile.resort} />}` to `HexTileVisual`.

D) Tests

* Extend `/packages/client-web/src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx` with NEW assertions:
  * Value text is centered and shifted up (y = centerY - 10).
  * Value text does not include a "W" prefix.
  * Resort icon `<image>` is present when resort is DOM/INF/FOR.

### 5.2 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: client-only rendering + test)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* ASCII only.
* No asset relocation (use existing paths).
* Determinism: no RNG, no Date.now, no window-dependent logic.

---

## 7) Invariants (Must remain true)

* No engine changes.
* Resort icon mapping is limited to DOM/INF/FOR in this task.

---

## 8) Implementation Plan

* [ ] Update HexTileVisual weight text: no "W", y = center - 10, font size 130.
* [ ] Add `ResortIcon` that renders DOM/INF/FOR as an SVG `<image>`.
* [ ] Wire `ResortIcon` into `HexBoard` via `resortIcon` prop.
* [ ] Extend HexTileVisual smoke tests with assertions for value positioning/prefix and icon `<image>`.
* [ ] Run `pnpm -w lint` and `$env:NO_COLOR=1; pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] Tiles show DOM/INF/FOR icons (not plain text) when resort exists.
* [ ] Weight value is centered and readable; matches simulator placement.
* [ ] Tests pass.

---

## 10) PR Checklist (Repo Artifact)

* [x] No new dependencies
* [x] No engine changes
* [x] Value uses 130px font and y = center - 10
* [x] Resort icon mapping only for DOM/INF/FOR
* [x] Tests updated and passing
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] Determinism verified (N/A: client-only rendering + test)
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Center tile weight value at `y = center - 10` using `fontSize=130` and remove the "W" prefix.
* Add `ResortIcon` that renders DOM/INF/FOR using existing SVG assets via `<image>`.
* Wire `ResortIcon` through `HexBoard` into `HexTileVisual`.
* Extend HexTileVisual smoke tests to assert value positioning/prefix and resort icon `<image>` presence.

---

## 12) Commands Run (exact)

* `pnpm -w lint` (OK)
* `$env:NO_COLOR=1; pnpm -w test` (OK)
* `git status` (OK)
* `git diff --stat` (OK)

---

## 13) Postflight Proof (copy/paste outputs)

### 13.1 pnpm -w lint

```
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
```

### 13.2 pnpm -w test

```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 70ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 10ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 11ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 13ms
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 14ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 17ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 17ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 16ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 23ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 27ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 48ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 39ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 106ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 189ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 17ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 13ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 252ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 7ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 14ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 9ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 7ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 5ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  13:09:17
packages/game test:    Duration  4.51s (transform 4.41s, setup 0ms, collect 24.20s, tests 927ms, environment 10ms, prepare 5.86s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 7ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 17ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 38ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 81ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 60ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 72ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 104ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 100ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 103ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 118ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 130ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 138ms
packages/client-web test:  Test Files  12 passed (12)
packages/client-web test:       Tests  41 passed (41)
packages/client-web test:    Start at  13:09:22
packages/client-web test:    Duration  3.65s (transform 701ms, setup 3ms, collect 6.80s, tests 968ms, environment 21.82s, prepare 2.79s)
packages/client-web test: Done
```

### 13.3 git status

```
On branch task/0068-hextile-value-and-icons
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0068-hextile-value-and-icons.md
	modified:   packages/client-web/src/components/HexBoard.tsx
	modified:   packages/client-web/src/ui/tiles/HexTileVisual.tsx
	modified:   packages/client-web/src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/ui/tiles/ResortIcon.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.4 git diff --stat

```
 docs/tasks/0068-hextile-value-and-icons.md         | 246 ++++++++++++++++-----
 packages/client-web/src/components/HexBoard.tsx    |   2 +
 packages/client-web/src/ui/tiles/HexTileVisual.tsx |   7 +-
 .../tiles/__tests__/HexTileVisual.smoke.test.tsx   |  34 +++
 4 files changed, 229 insertions(+), 60 deletions(-)
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 13:10:54 2026 +0100

    task(0068): center tile value + resort icons

- Remove 'W' prefix and align value at y = center - 10 with 130px font
- Add DOM/INF/FOR resort icons via SVG <image> helper
- Wire resort icons through HexBoard and extend smoke tests

 docs/tasks/0068-hextile-value-and-icons.md         | 387 ++++++++++++++++++---
 packages/client-web/src/components/HexBoard.tsx    |   2 +
 packages/client-web/src/ui/tiles/HexTileVisual.tsx |   7 +-
 packages/client-web/src/ui/tiles/ResortIcon.tsx    |  18 +
 .../tiles/__tests__/HexTileVisual.smoke.test.tsx   |  34 ++
 5 files changed, 388 insertions(+), 60 deletions(-)
```

---

## 15) Amendments (append-only)
