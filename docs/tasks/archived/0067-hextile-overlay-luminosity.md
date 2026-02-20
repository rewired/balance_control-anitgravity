# Task 0067 - HexTile Overlay: mix-blend-mode luminosity @ 0.8 + isolate

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0067-hextile-overlay-luminosity`

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

* GR-002: UI-only change in `packages/client-web` (CSS + SVG image styles), no engine state, rules, determinism, or RNG changes.
* GR-014: Presentation-only change to overlay blending and per-tile isolation; no icon mapping changes.

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

Make the tile overlay render like Affinity's "Luminanz" blend:

* ONLY: `mix-blend-mode: luminosity`
* Strength fixed at `0.8` (opacity)
* No dark artifacts leaking through alpha
* Blend MUST be isolated to each tile (no interaction with board background)

---

## 3) Non-Goals

* No new overlay modes (no multiply, no two-pass, no filters).
* No engine/state changes.

---

## 4) Inputs

* Current tile stack is composed in:
  * `/packages/client-web/src/ui/tiles/HexTileVisual.tsx`
  * `/packages/client-web/src/ui/tiles/HexTileFrame.tsx`
  * `/packages/client-web/src/ui/tiles/GlassOverlay.tsx`
* Asset:
  * `/packages/client-web/src/assets/tiles/tile-overlay.png`

---

## 5) Outputs

### 5.1 Code

Overlay rendering:

* Update `/packages/client-web/src/ui/tiles/GlassOverlay.tsx`
  * Apply `mixBlendMode: 'luminosity'`.
  * Apply `opacity: 0.8`.
  * Keep `preserveAspectRatio="none"`.
  * Keep `pointerEvents="none"`.

Isolation / stacking context:

* Ensure each tile is an isolated blending context.
  * CSS `isolation: isolate` on `.hex-cell` and/or `.hex-tile-visual`.
  * Location: `/packages/client-web/src/index.css` (where `.hex-cell` is defined).

Tests:

* Extend `/packages/client-web/src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx` with NEW assertions:
  * The overlay `<image>` has `style` containing `mix-blend-mode: luminosity`.
  * The overlay `<image>` has opacity 0.8 (attribute or inline style).

### 5.2 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: client-only styling + test)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* ASCII only.
* Determinism: no RNG, no Date.now, no window-dependent logic.
* Do not change the tile geometry constants.

---

## 7) Invariants (Must remain true)

* Overlay uses ONLY `mix-blend-mode: luminosity` at fixed 0.8 strength (no additional overlay modes).
* No engine/state changes.

---

## 8) Implementation Plan

* [ ] Add `mixBlendMode: 'luminosity'`, `opacity: 0.8`, and `pointerEvents: 'none'` to the overlay `<image>` in `GlassOverlay`.
* [ ] Add per-tile isolation via CSS `isolation: isolate` on `.hex-cell` (or `.hex-tile-visual`) in `index.css`.
* [ ] Update the HexTileVisual smoke test to assert luminosity blend + 0.8 opacity on the overlay `<image>`.
* [ ] Run `pnpm -w lint` and `$env:NO_COLOR=1; pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] On the board, enabling the overlay does NOT create dark blotches in semi-transparent regions.
* [ ] Overlay visually matches: "luminosity" blend at ~80% strength.
* [ ] Each tile blends in isolation (no interaction with board background).
* [ ] Smoke tests pass.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] No engine changes
* [x] Overlay uses ONLY mix-blend-mode: luminosity
* [x] Overlay strength is fixed at 0.8
* [x] Each tile blends in isolation
* [x] Tests updated and passing
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] Determinism verified (N/A: client-only styling + test)
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Render the tile overlay image with `mix-blend-mode: luminosity` at fixed `opacity: 0.8` and `pointer-events: none`.
* Isolate blending per tile via CSS `isolation: isolate` on `.hex-cell` to prevent interaction with the board background.
* Extend the HexTileVisual smoke test to assert the overlay blend mode and opacity.

---

## 12) Commands Run (exact)

* `git checkout -b task/0067-hextile-overlay-luminosity`
* `pnpm -w lint` (pass)
* `$env:NO_COLOR=1; pnpm -w test` (pass)
* `git status`
* `git diff --stat`

---

## 13) Postflight Proof (copy/paste output)

### 13.1 pnpm -w lint

```
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
```

### 13.2 $env:NO_COLOR=1; pnpm -w test

```
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
packages/game test:  ✓ test/setup.test.ts  (8 tests) 20ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 23ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 26ms
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 27ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 35ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 21ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 18ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 27ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 30ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 43ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 40ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 102ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 211ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 15ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 8ms
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 14ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 266ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 12ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 5ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 4ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  12:58:30
packages/game test:    Duration  4.68s (transform 4.14s, setup 1ms, collect 24.53s, tests 1.04s, environment 15ms, prepare 5.64s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 32ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 12ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 34ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 65ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (5 tests) 107ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 82ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 72ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 100ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 115ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 112ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 128ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 138ms
packages/client-web test:  Test Files  12 passed (12)
packages/client-web test:       Tests  37 passed (37)
packages/client-web test:    Start at  12:58:36
packages/client-web test:    Duration  3.92s (transform 1.09s, setup 3ms, collect 7.63s, tests 997ms, environment 23.64s, prepare 2.90s)
packages/client-web test: Done
```

### 13.3 git status

```
On branch task/0067-hextile-overlay-luminosity
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0067-hextile-overlay-luminosity.md
	modified:   packages/client-web/src/index.css
	modified:   packages/client-web/src/ui/tiles/GlassOverlay.tsx
	modified:   packages/client-web/src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.4 git diff --stat

```
 docs/tasks/0067-hextile-overlay-luminosity.md      | 227 ++++++++++++++++-----
 packages/client-web/src/index.css                  |   1 +
 packages/client-web/src/ui/tiles/GlassOverlay.tsx  |   2 +-
 .../tiles/__tests__/HexTileVisual.smoke.test.tsx   |   5 +-
 4 files changed, 181 insertions(+), 54 deletions(-)
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 13:00:27 2026 +0100

    task(0067): isolate luminosity tile overlay

- Render tile overlay with mix-blend-mode: luminosity at fixed opacity 0.8
- Add per-tile isolation via CSS isolation on .hex-cell
- Extend HexTileVisual smoke test to assert blend mode + opacity

 docs/tasks/0067-hextile-overlay-luminosity.md      | 375 ++++++++++++++++++---
 packages/client-web/src/index.css                  |   1 +
 packages/client-web/src/ui/tiles/GlassOverlay.tsx  |   2 +-
 .../tiles/__tests__/HexTileVisual.smoke.test.tsx   |   5 +-
 4 files changed, 329 insertions(+), 54 deletions(-)
```

---

## 15) Amendments (append-only)
