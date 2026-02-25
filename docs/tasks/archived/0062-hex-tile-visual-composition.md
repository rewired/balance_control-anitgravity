# Task 0062 - HexTileVisual composition (frame + content + overlay + markers + badges)

**Date:** 2026-02-16
**Owner:** Codex
**Branch:** `task/0062-hex-tile-visual-composition`

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

* GR-002: `HexTileVisual` composes presentation layers from passed-in props only; it does not compute legality, costs, majority, modifiers, or production.
* GR-014: The layer order is copied from the normative UI contract (`UI-HEX-TILE-VISUAL v0.2`) and treated as stable presentation behavior.

### guardrail_gate

* [x] I read the guardrails file before implementation.
* [x] I can explain compliance for every affected GR-xxx.
* [x] If any GR-xxx would be violated: I STOP, create a DD doc, and do not implement.

---

## 1) Primary Spec Anchors (MUST)

* ARCH: ARCH-01:CLIENT_RESTRICTIONS (client is presentation-only)
* UI: UI-HEX-TILE-VISUAL v0.2 (`docs/ui/hex-tile/UI-HEX-TILE-VISUAL.v0.2.yaml`) -> `layering_bottom_to_top`

---

## 2) Goal

Create the final composed HexTile component used by the board:

* frame (majority fill + inner disc)
* tile content hooks (resort icon, optional W)
* glass overlay
* influence corners (hover/selected reveal)
* badge slots

Expose a stable prop API and manage hover/selected CSS/data attributes at the tile root.

---

## 3) Non-Goals

* No engine changes.
* No client-side rules logic (legality/costs/majority/modifiers remain engine-only).
* No hover event handling here (hover/selected are inputs; interaction wiring happens elsewhere).

---

## 4) Inputs

* Task 0058: `packages/client-web/src/ui/tiles/HexTileFrame.tsx`
* Task 0061: `packages/client-web/src/ui/tiles/GlassOverlay.tsx` (already layered inside `HexTileFrame`)
* Task 0059: `packages/client-web/src/ui/tiles/InfluenceCorners.tsx`
* Task 0060: `packages/client-web/src/ui/tiles/BadgeSlots.tsx`

---

## 5) Outputs

### 5.1 Code

* `packages/client-web/src/ui/tiles/HexTileVisual.tsx` (new)

Minimum props:

```ts
type SeatId = 1 | 2 | 3 | 4 | 5 | 6;

type HexTileVisualProps = {
  majoritySeat: SeatId | null;
  seatColor: (seat: SeatId) => string;

  isHovered: boolean;
  isSelected: boolean;

  influenceBySeat: Partial<Record<SeatId, number>>;
  metaIconsBySeat: Partial<Record<SeatId, React.ReactNode[]>>;

  badges: Array<{ key: string; icon: React.ReactNode; tone?: "neutral" | "warn" | "danger" }>;

  resortIcon?: React.ReactNode;
  valueW?: number;
  className?: string;
};
```

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
* No client legal move logic.
* Single `<svg viewBox="0 0 747 864" style={{ overflow: 'visible' }}>` at the tile root.
* Deterministic DOM order for layers:
  * frame
  * content
  * overlay
  * markers
  * badges
  * interaction outlines (if any)

---

## 7) Invariants (Must remain true)

* Canonical viewBox and geometry constants are used everywhere.
* Marker/badge layers are above overlay.
* Marker layer has `pointer-events: none`.

---

## 8) Implementation Plan

* [ ] Add `HexTileVisual.tsx` composing `HexTileFrame` + `InfluenceCorners` + `BadgeSlots` in deterministic DOM order.
* [ ] Render hover/selected via stable `data-*` attributes (and optional CSS classes) on the tile root.
* [ ] Keep marker layer `pointer-events: none` and render markers/badges above overlay.
* [ ] Run `pnpm -w lint` and `$env:NO_COLOR=1; pnpm -w test` for postflight proof.

---

## 9) Acceptance Criteria

* [ ] Non-hover + non-selected: markers hidden.
* [ ] Hover or selected: markers visible (number + all meta icons).
* [ ] Badges appear in correct slots and do not drift with hover.
* [ ] No engine packages touched.

---

## 10) PR Checklist (Repo Artifact)

* [x] Guardrails: affected GR-xxx listed (or NONE) and compliance demonstrated
* [x] Normative anchors cited for all changes
* [x] Layering order matches spec
* [x] Single SVG, canonical viewBox
* [x] Marker layer pointer-events none
* [x] No engine packages touched
* [x] `pnpm -w lint` passes
* [x] `$env:NO_COLOR=1; pnpm -w test` passes
* [x] No temporary files committed

---

## 11) Work Summary (3-7 bullets)

* Added `HexTileVisual` composed tile renderer that assembles frame, content, markers, and badges in canonical tile space.
* Ensured deterministic DOM layer order and kept markers/badges above the glass overlay.
* Added stable hover/selected `data-*` attributes at the tile root for styling hooks (presentation-only).

---

## 12) Commands Run (with outcomes)

* `pnpm -w lint` -> ok
* `$env:NO_COLOR=1; pnpm -w test` -> ok

---

## 13) Postflight Proof (copy/paste output)

### 13.1 git status

```
On branch task/0062-hex-tile-visual-composition
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0062-hex-tile-visual-composition.md
	modified:   packages/client-web/src/ui/tiles/HexTileFrame.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/ui/tiles/HexTileVisual.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

### 13.2 git diff --stat

```
 docs/tasks/0062-hex-tile-visual-composition.md    | 331 ++++++++++++++++++----
 packages/client-web/src/ui/tiles/HexTileFrame.tsx |  13 +-
 2 files changed, 292 insertions(+), 52 deletions(-)
```

### 13.3 tests ($env:NO_COLOR=1; pnpm -w test)

```
> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 84ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 42ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 18ms
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 17ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 18ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 16ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 23ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 28ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 36ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 36ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 54ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 64ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 154ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 278ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 299ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 20ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 9ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 15ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 11ms
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 20ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 6ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 5ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  09:58:00
packages/game test:    Duration  5.50s (transform 4.27s, setup 5ms, collect 38.00s, tests 1.26s, environment 7ms, prepare 6.65s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 7ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 9ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 53ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 126ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 141ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 96ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 81ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 82ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 106ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 171ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 202ms
packages/client-web test:  Test Files  11 passed (11)
packages/client-web test:       Tests  32 passed (32)
packages/client-web test:    Start at  09:58:06
packages/client-web test:    Duration  4.46s (transform 1.11s, setup 2ms, collect 7.09s, tests 1.07s, environment 24.21s, prepare 3.36s)
packages/client-web test: Done
```

---

## 14) Commit Proof (copy/paste output)

After creating exactly ONE commit, paste:

### 14.1 git show -1 --stat

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Mon Feb 16 10:00:17 2026 +0100

    task(0062): compose hex tile visual layers

- Add HexTileVisual composed SVG tile renderer
- Preserve canonical layer order (frame/content/overlay/markers/badges)
- Add root data attributes for hover/selected styling hooks
- Record checklist and postflight proof in task file

 docs/tasks/0062-hex-tile-visual-composition.md     | 346 ++++++++++++++++++---
 packages/client-web/src/ui/tiles/HexTileFrame.tsx  |  13 +-
 packages/client-web/src/ui/tiles/HexTileVisual.tsx |  94 ++++++
 3 files changed, 401 insertions(+), 52 deletions(-)
```

---

## 15) Amendments (append-only)
