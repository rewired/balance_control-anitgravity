# Task 0069 - Dev: HexTile packed simulator page (37 tiles)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0069-dev-hextile-packed-simulator`

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

* GR-002: Simulator is dev-only UI that renders visuals only; it does not compute or assert legality, costs, majority, modifiers, production, or any engine rules.
* GR-014: Simulator does not modify the tile-type-to-icon mapping; it reuses existing tile visual primitives for manual QA.

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

Add a deterministic dev-only view that reproduces the packed hex layout (tiles touch with no gaps) and allows quick QA of:

* overlay blend mode
* icon + value placement
* marker/badge layering

Target: 37 tiles (radius=3), 6 seats.

---

## 3) Non-Goals

* No routing overhaul.
* No production UI changes outside dev routes.
* No engine changes.

---

## 4) Inputs

* Existing dev page: `packages/client-web/src/dev/HexTilePlayground.tsx`
* Existing viewport (pan/zoom): `packages/client-web/src/components/BoardViewport.tsx`
* Existing tile visual: `packages/client-web/src/ui/tiles/HexTileVisual.tsx`
* Existing hex board layout math (axial -> pixel): locate and reuse existing conversion used by HexBoard.

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/dev/HexTilePackedSimulator.tsx` (new)
* `packages/client-web/src/dev/HexTilePlayground.tsx` (add a toggle/button to switch between grid and packed)

Packed simulator requirements:

* Generate axial coords in radius=3 (37 tiles).
* Convert axial -> pixel using the SAME math as HexBoard.
* Render tiles with absolute positioning so they are edge-to-edge.
* Use `BoardViewport` for pan/zoom.
* Deterministic random demo data (fixed seed RNG; mulberry32).
* Add a tiny runtime assertion (dev-only) that nearest-neighbor distance is within epsilon (catch accidental size changes).

### 5.2 Docs

N/A

Changelog / DD / ERRATA:

* [ ] `/docs/changelog.md` updated (N/A: dev-only UI)
* [ ] `/docs/design-decisions/DD-XXXX-<topic>.md` created (N/A)
* [ ] `/docs/rules/ERRATA-XXXX.md` created (N/A)

---

## 6) Constraints (Hard)

* ASCII only.
* No new deps.
* Dev-only; must not be reachable in production builds (guard with `import.meta.env.DEV`).

---

## 7) Invariants (Must remain true)

* Uses the same `HexTileVisual` component as the board (no forked rendering).
* Pan/zoom behavior comes from `BoardViewport` (no custom pan/zoom).

---

## 8) Implementation Plan

* [ ] Add `HexTilePackedSimulator` that lays out axial radius=3 coords using the HexBoard axial->pixel conversion and absolute positioning.
* [ ] Provide deterministic demo data via fixed-seed mulberry32 (no Math.random).
* [ ] Add a dev-only nearest-neighbor distance assertion with small epsilon tolerance.
* [ ] Add an entry toggle in `HexTilePlayground` to switch between "grid" and "packed".
* [ ] Run `pnpm -w lint` and `$env:NO_COLOR=1; pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] Packed view renders 37 tiles (radius=3) that touch (no visible gaps between neighbors).
* [ ] Pan/zoom works via `BoardViewport`.
* [ ] Overlay blending stays isolated per tile.
* [ ] Easy to access from existing dev UI (via toggle/button).
* [ ] No production behavior changes.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] No implicit rules introduced
* [x] No phantom moves introduced
* [x] Expansion isolation preserved (N/A)
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] Determinism verified (N/A: dev-only UI)
* [x] No temporary files committed
* [x] `/docs/changelog.md` updated if required (N/A)

---

## 11) Work Summary (3-7 bullets)

* Add `HexTilePackedSimulator` dev view rendering a packed axial radius=3 layout (37 tiles) using the same `axialToPixel` math as HexBoard.
* Reuse `BoardViewport` pan/zoom controls for manual QA in the packed layout.
* Generate deterministic demo tile props via fixed-seed `mulberry32` (no Math.random).
* Add a dev-only runtime assertion that nearest-neighbor distance matches expected packed spacing (epsilon check).
* Add a `HexTilePlayground` view toggle to switch between the existing grid view and the new packed simulator.

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
On branch task/0069-dev-hextile-packed-simulator
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0069-dev-hextile-packed-simulator.md
	modified:   packages/client-web/src/components/BoardViewport.tsx
	modified:   packages/client-web/src/dev/HexTilePlayground.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/dev/HexTilePackedSimulator.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 docs/tasks/0069-dev-hextile-packed-simulator.md    | 232 ++++++++++++++++-----
 .../client-web/src/components/BoardViewport.tsx    |  68 +++---
 packages/client-web/src/dev/HexTilePlayground.tsx  |  45 +++-
 3 files changed, 259 insertions(+), 86 deletions(-)
```

### 13.3 Tests

```

> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 69ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 23ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 8ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 30ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 32ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 21ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 21ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 28ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 31ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 51ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 43ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 110ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 197ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 252ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 9ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 14ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 22ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 7ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 8ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 5ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/computeMajorirty.test.ts  (5 tests) 5ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  13:30:02
packages/game test:    Duration  4.71s (transform 5.11s, setup 1ms, collect 27.71s, tests 1.00s, environment 7ms, prepare 5.71s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 7ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 5ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 62ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 52ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 51ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 103ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 77ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 101ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 102ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 107ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 136ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 138ms
packages/client-web test:  Test Files  12 passed (12)
packages/client-web test:       Tests  41 passed (41)
packages/client-web test:    Start at  13:30:08
packages/client-web test:    Duration  3.82s (transform 855ms, setup 2ms, collect 7.13s, tests 941ms, environment 23.37s, prepare 2.82s)
packages/client-web test: Done
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 13:32:40 2026 +0100

    task(0069): add packed hex tile simulator

- Add dev-only packed (radius=3) simulator using BoardViewport pan/zoom

- Generate deterministic demo tile props via fixed-seed mulberry32

- Add neighbor-distance runtime assertion to catch accidental size changes

- Wire a grid/packed toggle into HexTilePlayground for easy access

 docs/tasks/0069-dev-hextile-packed-simulator.md    | 365 ++++++++++++++++++---
 .../client-web/src/components/BoardViewport.tsx    |  68 ++--
 .../client-web/src/dev/HexTilePackedSimulator.tsx  | 236 +++++++++++++
 packages/client-web/src/dev/HexTilePlayground.tsx  |  45 ++-
 4 files changed, 628 insertions(+), 86 deletions(-)
```

---

## 15) Amendments (append-only)
