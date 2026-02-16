# Task 0070 - Centralize tile asset paths + icon mapping (single import surface)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0070-centralize-tile-assets-and-icon-mapping`

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

* GR-002: Client-only refactor (asset import consolidation). No legality/cost/majority/modifier computation is added to the client.
* GR-014: Icon mapping is not changed; it is centralized behind a single import surface.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* UI: UI-ICONS:mapping (`/docs/ui/icon-mapping.md`)

---

## 2) Goal

Prevent asset path drift by creating a single import surface for:

1) `tile-overlay.png` (glass overlay)
2) `base_tile.svg` (canonical tile SVG template, if ever needed by UI code)
3) Tile icons as SVG assets (DOM/INF/FOR and expansion icons if present)

All tile rendering code MUST import from this module instead of importing assets directly.

---

## 3) Non-Goals

* No engine changes.
* No changes to asset contents (no SVG edits, no PNG edits).
* No changes to tile-type-to-icon mapping (presentation contract stays stable).

---

## 4) Inputs

Existing assets (already in repo):

* `packages/client-web/src/assets/tiles/base_tile.svg`
* `packages/client-web/src/assets/tiles/tile-overlay.png`
* `packages/client-web/src/assets/tile-icons/*.svg` (dom/inf/for/eco/sec/clm/nrg)

Existing code likely importing assets directly:

* `packages/client-web/src/ui/tiles/GlassOverlay.tsx`
* `packages/client-web/src/ui/tiles/ResortIcon.tsx`
* `packages/client-web/src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx`

---

## 5) Outputs

### 5.1 Code

Create:

* `packages/client-web/src/ui/tiles/tileAssets.ts`

It MUST:

1) Import assets exactly once (Vite URL imports):

```ts
import overlayUrl from "../../assets/tiles/tile-overlay.png";
import baseTileUrl from "../../assets/tiles/base_tile.svg";

import domIconUrl from "../../assets/tile-icons/dom.svg";
import infIconUrl from "../../assets/tile-icons/inf.svg";
import forIconUrl from "../../assets/tile-icons/for.svg";

// optional: if these exist in repo
import ecoIconUrl from "../../assets/tile-icons/eco.svg";
import secIconUrl from "../../assets/tile-icons/sec.svg";
import clmIconUrl from "../../assets/tile-icons/clm.svg";
import nrgIconUrl from "../../assets/tile-icons/nrg.svg";
```

2) Export the URLs (or mappings) so tile rendering code can import from this single module.

Refactor all tile rendering code to import URLs only from `tileAssets.ts` (no direct imports of the assets above).

### 5.2 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: client-only refactor)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* ASCII only in code comments/docs for this task artifact.
* Determinism: no RNG, no Date.now, no window-dependent logic.
* Vite URL asset imports must live in exactly one module for these assets.

---

## 7) Invariants (Must remain true)

* No engine/state changes.
* Tile overlay visual behavior remains unchanged.
* Tile-type-to-icon mapping remains unchanged (only centralized).

---

## 8) Implementation Plan

* [ ] Add `tileAssets.ts` with a single import surface for overlay, base tile, and tile icons.
* [ ] Refactor all tile rendering code to import from `tileAssets.ts` only.
* [ ] Update tests that previously imported icon assets directly.
* [ ] Run `pnpm -w lint` and `$env:NO_COLOR=1; pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] All direct imports of `tile-overlay.png`, `base_tile.svg`, and `assets/tile-icons/*.svg` are removed from tile rendering code (only `tileAssets.ts` imports them).
* [ ] Client tests pass.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] `tileAssets.ts` is the single import surface for these assets
* [x] Tile rendering code no longer imports assets directly
* [x] No engine packages touched
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] Determinism verified (N/A: client-only refactor)
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Add `tileAssets.ts` as a single import surface for tile overlay, base tile SVG, and tile icon SVG assets.
* Refactor `GlassOverlay` and `ResortIcon` to import asset URLs from `tileAssets.ts` (no direct asset imports).
* Update `HexTileVisual.smoke` test to reference icon URLs via `tileAssets.ts` to prevent path drift.

---

## 12) Commands Run (exact)

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
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 76ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 20ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 26ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 1877ms
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 12ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 17ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 15ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 21ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 25ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 30ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 48ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 41ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 107ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 213ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 11ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 221ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 6ms
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 11ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 12ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 9ms
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 4ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 5ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  13:40:30
packages/game test:    Duration  4.60s (transform 4.87s, setup 4ms, collect 28.48s, tests 2.81s, environment 8ms, prepare 5.13s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 9ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 5ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 31ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 52ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 63ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 104ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 84ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 96ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 116ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 115ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 132ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 134ms
packages/client-web test:  Test Files  12 passed (12)
packages/client-web test:       Tests  41 passed (41)
packages/client-web test:    Start at  13:40:36
packages/client-web test:    Duration  3.76s (transform 948ms, setup 4ms, collect 7.54s, tests 941ms, environment 22.33s, prepare 2.77s)
packages/client-web test: Done
```

### 13.3 git status

```
On branch task/0070-centralize-tile-assets-and-icon-mapping
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0070-centralize-tile-assets-and-icon-mapping.md
	modified:   packages/client-web/src/ui/tiles/GlassOverlay.tsx
	modified:   packages/client-web/src/ui/tiles/ResortIcon.tsx
	modified:   packages/client-web/src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/ui/tiles/tileAssets.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.4 git diff --stat

```
 ...0070-centralize-tile-assets-and-icon-mapping.md | 184 ++++++++++++++++++---
 packages/client-web/src/ui/tiles/GlassOverlay.tsx  |   5 +-
 packages/client-web/src/ui/tiles/ResortIcon.tsx    |   9 +-
 .../tiles/__tests__/HexTileVisual.smoke.test.tsx   |  11 +-
 4 files changed, 174 insertions(+), 35 deletions(-)
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 13:42:09 2026 +0100

    task(0070): centralize tile asset imports

- Add a single tileAssets module for overlay, base tile, and icon URLs
- Refactor tile UI components and tests to import URLs from that module
- Reduce asset path drift and keep icon mapping stable

 ...0070-centralize-tile-assets-and-icon-mapping.md | 338 +++++++++++++++++++--
 packages/client-web/src/ui/tiles/GlassOverlay.tsx  |   5 +-
 packages/client-web/src/ui/tiles/ResortIcon.tsx    |   9 +-
 .../tiles/__tests__/HexTileVisual.smoke.test.tsx   |  11 +-
 packages/client-web/src/ui/tiles/tileAssets.ts     |  34 +++
 5 files changed, 362 insertions(+), 35 deletions(-)
```

---

## 15) Amendments (append-only)
