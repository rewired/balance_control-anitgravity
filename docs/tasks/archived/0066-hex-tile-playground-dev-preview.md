# Task 0066 - Dev preview: HexTile playground scene (manual QA at zoom levels)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0066-hex-tile-playground-dev-preview`

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

* GR-002: Playground uses `HexTileVisual` for presentation-only rendering; it does not compute or assert legality, costs, majority, modifiers, or production (engine-only).
* GR-014: Playground does not change the tile-type-to-icon mapping; it only renders existing visual primitives for manual QA.

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

Add an easy manual QA entry point for HexTile visuals:

* shows multiple tiles in a grid
* includes a zoom slider
* allows toggling hover/selected states via UI controls

This is for human verification (crispness, layering, clipping).

---

## 3) Non-Goals

* No engine changes.
* No Storybook integration (not present in repo).
* No production-visible debug UI.

---

## 4) Inputs

* `packages/client-web/src/ui/tiles/HexTileVisual.tsx` (Task 0062)

---

## 5) Outputs

### 5.1 Code

Option A (Dev route/page):

* `packages/client-web/src/dev/HexTilePlayground.tsx` (new)
* `packages/client-web/src/App.tsx` (dev-only entry point / routing)

Playground content MUST include:

* at least 6 tiles with different `majoritySeat` values
* hover/selected toggles
* badges in compact and belt modes
* `metaIconsBySeat` populated for several seats

### 5.2 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: dev-only UI)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* No engine changes.
* Do not ship dev-only UI into production builds (guard with `import.meta.env.DEV` and/or env flag).

---

## 7) Invariants (Must remain true)

* Uses the same `HexTileVisual` component as the board (no forked rendering).

---

## 8) Implementation Plan

* [ ] Add `HexTilePlayground` scene rendering a tile matrix with varied props (majority seats, badges, meta icons).
* [ ] Add a zoom slider (CSS scale) and UI toggles for hover/selected states.
* [ ] Wire a dev-only entry point (query param or env flag) without affecting production builds.
* [ ] Run `pnpm -w lint` and `$env:NO_COLOR=1; pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] A developer can open the playground in dev mode and visually verify:
  * overlay alignment
  * markers above overlay
  * no clipping
  * badge slot layout (compact vs belt)
* [ ] Playground is not reachable in production builds.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Playground is reachable in dev mode
* [x] No production bundle pollution (if applicable)
* [x] No engine packages touched
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] Determinism verified (N/A: dev-only UI)
* [x] No temporary files

---

## 11) Work Summary (3-7 bullets)

* Add a dev-only HexTile playground scene that renders a 6-tile matrix with varied `majoritySeat`, influence counts, meta icons, and badge layouts.
* Add UI controls for zoom + hover/selected toggles to manually QA overlay alignment, marker layering, clipping, and badge slot behavior.
* Wire the scene into the client app via a dev-only query param gate (`?dev=hex-tile`) to avoid production exposure.

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
> balance-control-monorepo@0.0.0 lint D:\\__DEV\\balance_control-anitgravity
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
```

### 13.2 $env:NO_COLOR=1; pnpm -w test

```
> balance-control-monorepo@0.0.0 test D:\\__DEV\\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 74ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 31ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 16ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 16ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 20ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 20ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 19ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 29ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 21ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 29ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 53ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 40ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 113ms
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
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 227ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 14ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 10ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 290ms
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 13ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 12ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 10ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 6ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 5ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  11:05:17
packages/game test:    Duration  5.27s (transform 4.88s, setup 3ms, collect 29.17s, tests 1.07s, environment 9ms, prepare 5.93s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 9ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 6ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (5 tests) 205ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 80ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 224ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 133ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 130ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 206ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 142ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 100ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 248ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 95ms
packages/client-web test:  Test Files  12 passed (12)
packages/client-web test:       Tests  37 passed (37)
packages/client-web test:    Start at  11:05:23
packages/client-web test:    Duration  5.39s (transform 1.07s, setup 1ms, collect 8.41s, tests 1.58s, environment 37.53s, prepare 3.35s)
packages/client-web test: Done
```

### 13.3 git status

```
On branch task/0066-hex-tile-playground-dev-preview
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0066-hex-tile-playground-dev-preview.md
	modified:   packages/client-web/src/App.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/dev/

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.4 git diff --stat

```
 docs/tasks/0066-hex-tile-playground-dev-preview.md | 189 ++++++++++++++++-----
 packages/client-web/src/App.tsx                    |  19 ++-
 2 files changed, 166 insertions(+), 42 deletions(-)
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 11:07:31 2026 +0100

    task(0066): add dev-only hex tile playground

- Add a dev-only HexTile playground scene reachable via ?dev=hex-tile
- Provide zoom and hover/selected controls for manual QA of layering and badge layouts
- Gate playground behind import.meta.env.DEV to avoid production exposure

 docs/tasks/0066-hex-tile-playground-dev-preview.md | 337 ++++++++++++++++++---
 packages/client-web/src/App.tsx                    |  19 +-
 packages/client-web/src/dev/HexTilePlayground.tsx  | 258 ++++++++++++++++
 3 files changed, 572 insertions(+), 42 deletions(-)
```

---

## 15) Amendments (append-only)
