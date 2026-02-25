# Codex Task 0055 - Unplaceable Draw Handling: Public Notice + Forced Confirm + Redraw Loop

**Date:** 2026-02-16
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5
- State shape: ARCH-02
- Determinism: AGENTS 0.2
- Core rules: `/docs/rules/000-core.md` (CORE-01)
  - CORE-01-04-06: Unplaceable drawn tile -> DiscardFaceUp
  - CORE-01-04-07: Then draw again

---

## Goal

When a tile is drawn but has **no legal placement**:
1) It is immediately moved to `DiscardFaceUp`.
2) ALL players see a public notice (and the tile, now face-up).
3) The drawing player must explicitly confirm (“OK”).
4) After confirm, the engine draws the next tile automatically (repeat until placeable or bag empty).

This must be deterministic and enforced engine-side (no client-side legality computation).

---

## Inputs

- Task 0054 landed:
  - DrawPile is closed in playerView.
  - DiscardFaceUp is visible in UI.
- Engine already has `enumerateLegalIntents` and `pendingChoice` mechanics.
- There is an existing choice resolution move (`resolveChoice`).

---

## Outputs

### A) Engine: Detect unplaceable drawn tile and schedule confirm-gated redraw

Implement deterministic handling:

1) Trigger point:
   - After a tile is drawn into the current player’s staging (or immediately after any “draw tile” action),
     run an engine-side check: “exists at least one legal `placeTile` intent for the staged tile”.

2) If no legal placement exists:
   - Move staged tile to `DiscardFaceUp` (CORE-01-04-06).
   - Append a public notice entry (engine state, visible to all):
     - Store in `G.engine.attributes.publicLog` (append-only, cap to last 20).
     - Entry example:
       `{ id, kind: "tile.unplaceable", playerId, tileId }`
   - Create a forced pending choice for the drawing player:
     - kind: `selectOption`
     - single option: “OK”
   - On resolving that choice, engine automatically draws the next tile (CORE-01-04-07),
     then re-runs the same legality check (loop).

3) Blocking:
   - While this pending choice exists, only `resolveChoice` must be legal for that player.

Implementation notes:
- Keep draw logic centralized and deterministic.
- Avoid circular imports; factor draw helper if needed.

Engine tests:
- Add `packages/game/test/unplaceable-draw-redraw.test.ts`
  - Create a state where placement is impossible (e.g. prohibitions block placeTile or board has no legal slots).
  - Assert: tile moved to DiscardFaceUp, publicLog entry added, pendingChoice created.
  - Resolve “OK”: assert a new draw occurs (or stops cleanly if DrawPile empty).
  - Assert: no other intents are legal during pendingChoice.

---

### B) UI: Public notice overlay (all players) + confirm only for drawer

Add:
- `packages/client-web/src/components/PublicNoticeOverlay.tsx`

Behavior:
- Reads `G.engine.attributes.publicLog`.
- For newest `kind="tile.unplaceable"` entry:
  - Show message: “Player X drew a tile that cannot be placed. It was discarded face-up.”
  - Render the tile (it is now in DiscardFaceUp, so UI can render it normally).
  - Only the drawing player sees the confirm control (through existing pendingChoice UI).
  - Others see info only.

Wire into `GameLayout` near the top-level so it overlays regardless of panels.

UI tests:
- Add `packages/client-web/test/public-notice-unplaceable.test.tsx`
  - Non-drawer: sees message, no confirm button.
  - Drawer: sees message + confirm via existing pendingChoice renderer (smoke test).

---

## Constraints

- No client-side legality computation.
- Must remain deterministic and replayable.
- Do not change rules semantics; confirmation is UX gating, not a rules change.

---

## Invariants

- Unplaceable tile is always moved to DiscardFaceUp before any redraw.
- Public notice is visible to all.
- During pendingChoice, only `resolveChoice` is legal.

---

## Acceptance Criteria

1) If a drawn tile has no legal placement, all players get the notice and see the tile in DiscardFaceUp.
2) The drawing player must confirm; only after confirmation does the next draw occur.
3) Loop repeats until a placeable tile is drawn or DrawPile is empty.
4) `pnpm -w test` is green.

---

## PR Checklist

- [x] Engine: unplaceable draw detection + discard + publicLog + pendingChoice + confirm-gated redraw loop
- [x] Engine tests: unplaceable-draw-redraw coverage
- [x] UI: PublicNoticeOverlay for publicLog entries
- [x] UI tests: overlay behavior for drawer vs others
- [x] Update `docs/PR_TASK_LIST.md` (add Task 0055)
- [x] Update `CHANGELOG.md` (Unreleased)
- [x] CI green

---

## Guardrails

affected_guardrails:

- GR-001
- GR-002
- GR-003
- GR-004
- GR-006

spec_anchor_refs:

- CORE-01-04-04
- CORE-01-04-06
- CORE-01-04-07

## Work Summary

- Implemented engine-side unplaceable draw handling: discard to DiscardFaceUp, publicLog entry, forced confirm, and confirm-gated redraw loop.
- Refactored draw helper into `packages/game/src/mechanics-draw.ts` to avoid circular imports and reuse `enumerateLegalIntents` for legality detection.
- Added engine regression tests covering discard/log/pendingChoice gating and redraw/empty termination.
- Added `PublicNoticeOverlay` wired into `GameLayout` plus RTL tests for drawer vs non-drawer visibility.
- Updated `docs/PR_TASK_LIST.md` and `CHANGELOG.md` (Unreleased).

## Commands Run

```bash
git status
On branch task/0055-unplaceable-draw-handling
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   CHANGELOG.md
	modified:   docs/PR_TASK_LIST.md
	modified:   packages/client-web/src/components/GameLayout.tsx
	modified:   packages/client-web/src/index.css
	modified:   packages/game/src/client-game.ts
	modified:   packages/game/src/index.ts
	modified:   packages/game/src/mechanics-turn.ts
	modified:   packages/game/src/moves.ts
	modified:   packages/game/test/legal-intents.test.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/components/PublicNoticeOverlay.tsx
	packages/client-web/test/public-notice-unplaceable.test.tsx
	packages/game/src/mechanics-draw.ts
	packages/game/test/unplaceable-draw-redraw.test.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git diff --stat
 CHANGELOG.md                                      |  2 +-
 docs/PR_TASK_LIST.md                              |  1 +
 packages/client-web/src/components/GameLayout.tsx |  2 +
 packages/client-web/src/index.css                 | 30 +++++++++
 packages/game/src/client-game.ts                  |  2 +-
 packages/game/src/index.ts                        |  7 +-
 packages/game/src/mechanics-turn.ts               | 78 +----------------------
 packages/game/src/moves.ts                        | 10 +++
 packages/game/test/legal-intents.test.ts          |  2 +-
 9 files changed, 51 insertions(+), 83 deletions(-)
```

```bash
$env:NO_COLOR="1"; pnpm -w test

> balance-control-monorepo@0.0.0 test D:\\__DEV\\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 52ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 24ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 12ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 12ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 14ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 16ms
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 20ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 23ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 22ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/moves.test.ts  (22 tests) 32ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 53ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 41ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 123ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 220ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 8ms
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 12ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 283ms
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 10ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 19ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 12ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 4ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 5ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  Test Files  23 passed (23)
packages/game test:       Tests  91 passed (91)
packages/game test:    Start at  05:00:13
packages/game test:    Duration  4.77s (transform 4.29s, setup 2ms, collect 30.81s, tests 1.02s, environment 7ms, prepare 6.16s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 7ms
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 7ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 37ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 75ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 85ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 74ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 98ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 104ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 108ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 123ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 134ms
packages/client-web test:  Test Files  11 passed (11)
packages/client-web test:       Tests  32 passed (32)
packages/client-web test:    Start at  05:00:19
packages/client-web test:    Duration  3.71s (transform 673ms, setup 1ms, collect 5.94s, tests 852ms, environment 20.48s, prepare 2.32s)
packages/client-web test: Done
```
