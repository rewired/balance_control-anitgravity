# Codex Task 0054 - DrawPile Privacy (Closed Bag) + UI: Draw Count Widget + DiscardFaceUp

**Date:** 2026-02-16
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)
**Primary contract:** `AGENTS.md` (repo root)

Key anchors (ASCII only):

- No rules drift: AGENTS 0.1, 0.5, 0.6
- Client is presentation only: ARCH-01, AGENTS 1.5
- State shape: ARCH-02
- Determinism: AGENTS 0.2
- Core rules: `/docs/rules/000-core.md` (CORE-01)
  - DrawPile is a closed bag exception
  - DiscardFaceUp is face-up

---

## Goal

1) Enforce DrawPile as **closed bag** at the `playerView` boundary (no IDs, no tile defs leakage).
2) UI shows DrawPile as **count-only widget** (no `Zone` renderer for DrawPile).
3) UI shows `DiscardFaceUp` as a visible zone (face-up).

---

## Inputs

- Client currently renders `DrawPile` via `<Zone zoneId="DrawPile" />`, exposing remaining tiles.
- `buildPlayerView` currently does not mask DrawPile contents, so clients can infer the bag.
- Web uses `packages/game/src/client-game.ts`; server/build uses `packages/game/src/index.ts`.

---

## Outputs

### A) Engine: Harden `playerView` (DrawPile masking + hidden tile defs)

Update BOTH:
- `packages/game/src/index.ts`
- `packages/game/src/client-game.ts`

Implement in `buildPlayerView`:

1) DrawPile masking:
   - Keep `G.zones.DrawPile` present.
   - Replace `DrawPile.items` with placeholder IDs of same length.
   - Placeholders MUST NOT match any real object/tile IDs.

2) Tile definition filtering:
   - Do not expose tile defs that exist only in hidden zones (incl. DrawPile).
   - Replace `tiles: G.tiles` with a filtered map containing ONLY tiles referenced by visible zones
     (Board, DiscardFaceUp, and the current player’s visible zones as currently defined).

3) Preserve existing privacy rules (other players’ hidden zones, pendingChoice non-owner, etc.).

Tests:
- Update/add `packages/game/test/player-view.test.ts`
  - DrawPile count preserved.
  - DrawPile IDs are placeholders (not real).
  - Hidden tiles are absent from `view.tiles`.

---

### B) UI: Replace DrawPile Zone with closed-bag widget; show DiscardFaceUp

Update:
- `packages/client-web/src/components/GameLayout.tsx`

1) Remove rendering of `Zone` for DrawPile.
2) Add a compact widget:
   - Label: “Draw Bag” (or “Draw Pile”)
   - Count: `G.zones.DrawPile.items.length` (safe after masking)
3) Render `Zone` for `DiscardFaceUp` beneath the widget
   - Title: “Discard (Face Up)”

UI tests (RTL):
- Add `packages/client-web/test/drawpile-and-discard-ui.test.tsx`
  - DrawPile shows count and does not render tiles.
  - DiscardFaceUp renders tiles.

---

## Constraints

- Engine remains deterministic.
- Privacy must be enforced engine-side (playerView), not “UI hiding”.
- Update both entrypoints to avoid drift (`index.ts` and `client-game.ts`).

---

## Invariants

- DrawPile contents MUST NOT be reconstructible from view state.
- DiscardFaceUp remains visible and accurate.

---

## Acceptance Criteria

1) DrawPile is displayed as count-only in UI.
2) DiscardFaceUp is visible in UI and renders tiles.
3) PlayerView does not leak real DrawPile IDs or tile defs.
4) `pnpm -w test` is green.

---

## PR Checklist

- [x] PlayerView: mask DrawPile items (keep count)
- [x] PlayerView: filter hidden tile defs
- [x] UI: replace DrawPile zone with count widget
- [x] UI: add DiscardFaceUp zone
- [x] Tests: game + client-web
- [x] Update `docs/PR_TASK_LIST.md` (add Task 0054)
- [x] Update `CHANGELOG.md` (Unreleased)
- [x] CI green

---

## Guardrails

affected_guardrails:

- GR-002
- GR-003

## Work Summary

- Hardened `buildPlayerView` to mask `DrawPile` contents and filter hidden tile defs from `view.tiles`.
- Updated `GameLayout` to show DrawPile as a count-only "Draw Bag" widget and render `DiscardFaceUp` face-up.
- Added engine and UI tests to prevent privacy regressions.

## Commands Run

```bash
git status
On branch task/0054-drawpile-privacy
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   CHANGELOG.md
	modified:   docs/PR_TASK_LIST.md
	modified:   docs/tasks/0054-drawpile-privacy.md
	modified:   packages/client-web/src/components/GameLayout.tsx
	modified:   packages/game/src/client-game.ts
	modified:   packages/game/src/index.ts
	modified:   packages/game/test/player-view.test.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/test/drawpile-and-discard-ui.test.tsx

no changes added to commit (use "git add" and/or "git commit -a")
```

```bash
git diff --stat
 CHANGELOG.md                                      |  1 +
 docs/PR_TASK_LIST.md                              |  1 +
 docs/tasks/0054-drawpile-privacy.md               | 35 ++++++++++++++++-----
 packages/client-web/src/components/GameLayout.tsx |  9 +++++-
 packages/game/src/client-game.ts                  | 37 ++++++++++++++++++++++-
 packages/game/src/index.ts                        | 37 ++++++++++++++++++++++-
 packages/game/test/player-view.test.ts            | 25 +++++++++++++++
 7 files changed, 134 insertions(+), 11 deletions(-)
```

```bash
$env:NO_COLOR=1; pnpm -w test

> balance-control-monorepo@0.0.0 test D:\__DEV\balance_control-anitgravity
> pnpm -r --if-present test

Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 72ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test:  ✓ test/setup.test.ts  (8 tests) 21ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 29ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: PingPongModExp
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 16ms
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 22ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 17ms
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 22ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 30ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 31ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/legal-intents.test.ts  (6 tests) 27ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 54ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 44ms
packages/game test:  ✓ test/turn.test.ts  (9 tests) 123ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should end only after round settlement when draw pile empties mid-round
packages/game test: ERROR: disallowed move: pass
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 217ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 257ms
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 17ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: EXP-01 Economy & Labor
packages/game test: EXP-01 Setup Complete.
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: TestExp
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: ModExp
packages/game test:  ✓ test/expansion.test.ts  (2 tests) 15ms
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 17ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: EXP-03 Climate & Future
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 6ms
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 6ms
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: EXP-02 Security & Order
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 8ms
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 5ms
packages/game test:  Test Files  22 passed (22)
packages/game test:       Tests  89 passed (89)
packages/game test:    Start at  04:24:57
packages/game test:    Duration  5.40s (transform 4.11s, setup 5ms, collect 35.28s, tests 1.06s, environment 9ms, prepare 6.38s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 18ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 7ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 85ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 88ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 123ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 151ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 56ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 83ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 178ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 182ms
packages/client-web test:  Test Files  10 passed (10)
packages/client-web test:       Tests  30 passed (30)
packages/client-web test:    Start at  04:25:04
packages/client-web test:    Duration  4.26s (transform 822ms, setup 1ms, collect 6.03s, tests 971ms, environment 20.83s, prepare 2.65s)
packages/client-web test: Done
```
