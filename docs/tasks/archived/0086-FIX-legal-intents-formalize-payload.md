# Codex Task 0086 - FIX: LegalIntents FormalizeInfluence payload must match move contract

**Date:** 2026-02-17
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0086
- **Area:** `packages/game` legality enumeration + payload contracts
- **Recommended execution order:** independent (safe to do anytime)
- **Risk:** Low (payload rename + targeted test)

## 1) Context (frozen)

`enumerateLegalIntents(...)` is the single legal-action surface. Today the FormalizeInfluence intents use a payload key that does **not** match the move contract, so when we finally generate valid Formalize scenarios in tests/UX this will fail at payload validation.

Current mismatch:

- `packages/game/src/engine/legal-intents.ts` emits payload: `{ tileId, paymentResourceIds, extraResourceIds }`
- `packages/game/src/move-contracts.ts` expects payload: `{ committeeTileId, paymentResourceIds, extraResourceIds }` (Zod schema)
- `packages/game/src/moves/stages/politicalAction.ts` uses `committeeTileId` after validation

This is a silent footgun because the current `legal-intents.test.ts` does not produce a FormalizeIntent scenario (it doesn’t satisfy CORE-01-08-02 / “all starting influence placed” gate).

## 2) Goal (frozen)

- FormalizeInfluence intents emitted by `enumerateLegalIntents(...)` must have a payload that **passes** `formalizeInfluencePayloadSchema`.
- Add a regression test that actually creates a valid Formalize scenario and proves the emitted intent payload is move-valid.

## 3) Non-goals (frozen)

- Do not change FormalizeInfluence rules, costs, or gating logic.
- Do not relax Zod validation.
- Do not touch UI in this task.

## 4) Inputs (frozen)

- `packages/game/src/engine/legal-intents.ts` (`enumerateFormalize`)
- `packages/game/src/move-contracts.ts` (`formalizeInfluencePayloadSchema`)
- `packages/game/src/moves/stages/politicalAction.ts` (`formalizeInfluence`)
- `packages/game/test/legal-intents.test.ts` (“move-valid payloads” test)

## 5) Outputs (frozen)

### Code

- [x] Update `enumerateFormalize(...)` to emit `committeeTileId` (not `tileId`).

### Tests

- [x] Extend `packages/game/test/legal-intents.test.ts` with a scenario that:
  - enters `politicalAction` stage,
  - places/marks starting influence in a way that the Formalize gate is satisfied (CORE-01-08-02 / CORE-01-08-03),
  - provides exactly two payment resources of different resorts in PersonalSupply,
  - verifies `enumerateLegalIntents(...)` includes a `formalizeInfluence` intent,
  - executes `CoreMoves.formalizeInfluence(...)` using the emitted payload and asserts `INVALID_MOVE` is **not** returned.

*(Use minimal state manipulation; the point is payload contract compliance and move validity, not a full “place all starting influence” integration test.)*

## 6) Constraints (frozen)

- Determinism: no new randomness or time-based logic.
- Guardrails: keep the single legal action interface (enumeration remains pure).
- No phantom moves or new action types.

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-004 (Single Legal Action Interface)
- GR-005 (No Phantom Moves)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-004, GR-005)
- `docs/rules/000-core.md`:
  - `CORE-01-04-13` .. `CORE-01-04-19` (FormalizeInfluence)
  - `CORE-01-08-02` / `CORE-01-08-03` (start influence placement gate; referenced by current code)

## 8) Acceptance Criteria (frozen)

- [x] `enumerateLegalIntents(...)` emits `formalizeInfluence` payloads that validate against `formalizeInfluencePayloadSchema`.
- [x] New/extended `legal-intents.test.ts` fails on main before the fix and passes after the fix.
- [x] No other intent payload shapes change.

## 9) PR Checklist (frozen)

- [x] Payload contract is aligned across: intent enumeration → Zod schema → move implementation
- [x] No rule/logic changes beyond the payload key rename
- [x] Tests pass (`pnpm -r test`)
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Updated `enumerateFormalize(...)` to emit `committeeTileId` to match `formalizeInfluencePayloadSchema`.
- Added a regression test that satisfies the CORE-01-08-02/03 starting-influence gate and executes `CoreMoves.formalizeInfluence` using the emitted intent payload.
- Kept FormalizeInfluence rules/costs/gating logic unchanged.

### Commands Run

- `git checkout -b task/0086-fix-legal-intents-formalize-payload` -> ok
- `pnpm -r test` -> pass (exit 0)
- `$env:NO_COLOR='1'; pnpm -r test` -> pass (exit 0)
- `git status` -> see Postflight Proof
- `git diff --stat` -> see Postflight Proof
- `git add docs/tasks/0086-FIX-legal-intents-formalize-payload.md packages/game/src/engine/legal-intents.ts packages/game/test/legal-intents.test.ts` -> ok
- `git commit --amend ...` -> ok
- `git show -1 --stat` -> see Commit Proof

### Postflight Proof

#### `git status`

```text
On branch task/0086-fix-legal-intents-formalize-payload
nothing to commit, working tree clean
```

#### `git diff --stat`

```text
(no output)
```

#### Tests (`$env:NO_COLOR='1'; pnpm -r test`)

```text
Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 112ms
packages/game test:  ✓ test/computeMajority.test.ts  (5 tests) 15ms
packages/game test: stdout | test/setup.test.ts > SetupGame > should not apply ex01 setup when ex01 flag is disabled
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/setup.test.ts > SetupGame > should apply ex01 setup when enabled and keep deterministic deck composition
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/setup.test.ts  (8 tests) 12ms
packages/game test:  ✓ test/exp01-controller-grants-no-throw.test.ts  (1 test) 12ms
packages/game test: stdout | test/exp01-controller-grants-no-throw.test.ts > EXP-01 controller grants with no controller > should not throw and should SKIP grant when controller is missing
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 15ms
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should require explicit SKIP policy on all EXP-03 CONTROLLER grants
packages/game test: Expansion registered: exp03
packages/game test: stdout | test/exp03-controller-grants-no-throw.test.ts > EXP-03 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-03 effect path
packages/game test: Expansion registered: exp03
packages/game test:  ✓ test/determinism-policy.test.ts  (2 tests) 25ms
packages/game test:  ✓ test/legal-intents.test.ts  (7 tests) 28ms
packages/game test:  ✓ test/hotspot.test.ts  (3 tests) 29ms
packages/game test:  ✓ test/moves.test.ts  (22 tests) 39ms
packages/game test: stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without mutation
packages/game test: [move:placeInfluence] invalid payload: <root>: Expected object, received string
packages/game test:  ✓ test/player-view.test.ts  (3 tests) 22ms
packages/game test:  ✓ test/server-smoke.test.ts  (1 test) 48ms
packages/game test:  ✓ test/replay-runner.test.ts  (3 tests) 73ms
packages/game test:  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 21ms
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAction stage without mutation
packages/game test: ERROR: disallowed move: placeTile
packages/game test: stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a staging tile exists
packages/game test: ERROR: invalid move: passTilePlacement args: [object Object]
packages/game test:  ✓ test/turn.test.ts  (9 tests) 212ms
packages/game test: stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_convert_pingpong
packages/game test: ERROR: invalid move: placeInfluence args: [object Object]
packages/game test: stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex01_small
packages/game test: Expansion registered: exp01
packages/game test: EXP-01 Setup Complete.
packages/game test:  ✓ test/golden-replay.test.ts  (5 tests) 350ms
packages/game test:  ✓ test/tripwire-controller-grants-policy.test.ts  (1 test) 381ms
packages/game test:  ✓ test/exp02-controller-grants-no-throw.test.ts  (2 tests) 14ms
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should require explicit SKIP policy on all EXP-02 CONTROLLER grants
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-controller-grants-no-throw.test.ts > EXP-02 controller grants with no controller > should not throw and should not grant to Noise for uncontrolled EXP-02 effect path
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/resolver-invariants.test.ts  (5 tests) 11ms
packages/game test:  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 12ms
packages/game test:  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 13ms
packages/game test:  ✓ test/measure-deck-provider.test.ts  (4 tests) 15ms
packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > routes EXP-02 measure object ids to the EXP-02 measure zones
packages/game test: Expansion registered: exp02
packages/game test: Expansion registered: exp03
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > routes EXP-03 measure object ids to the EXP-03 measure zones
packages/game test: Expansion registered: exp02
packages/game test: Expansion registe…199 chars truncated…on registered: exp02
packages/game test: Expansion registered: exp03
packages/game test: stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > fails deterministically when multiple enabled decks match the same object id
packages/game test: Expansion registered: exp02
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: EXP-02 Setup Complete.
packages/game test: stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id
packages/game test: Expansion registered: exp02
packages/game test: EXP-02 Setup Complete.
packages/game test:  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 10ms
packages/game test:  ✓ test/engine-module-registry.test.ts  (1 test) 4ms
packages/game test:  ✓ test/resolver.test.ts  (6 tests) 10ms
packages/game test: stderr | test/resolver.test.ts > EffectResolver cost and production behavior > should not mutate state when resource.pay cannot be fully paid
packages/game test: [resolver:resource.pay] insufficient resources for cost
packages/game test: stdout | test/resolver.test.ts > EffectResolver cost and production behavior > should apply production modifiers (no PingPong production reduction)
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/move-assembly-invariants.test.ts  (3 tests) 5ms
packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > disabled expansion contributes no move modules
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > module ordering equals canonical order filtered by enablement (independent of registration order)
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/move-assembly-invariants.test.ts > Move assembly invariants > duplicate move keys fail deterministically
packages/game test: Expansion registered: exp02
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/expansion.test.ts  (3 tests) 5ms
packages/game test: stdout | test/expansion.test.ts > Expansion System > should register an expansion
packages/game test: Expansion registered: exp01
packages/game test: stdout | test/expansion.test.ts > Expansion System > should return expansions in deterministic canonical order
packages/game test: Expansion registered: exp03
packages/game test: Expansion registered: exp01
packages/game test: Expansion registered: exp02
packages/game test: stdout | test/expansion.test.ts > Expansion System > should apply production modifiers
packages/game test: Expansion registered: exp01
packages/game test:  ✓ test/production-uncontrolled.test.ts  (1 test) 3ms
packages/game test:  ✓ test/move-module-registry.test.ts  (1 test) 3ms
packages/game test:  Test Files  28 passed (28)
packages/game test:       Tests  107 passed (107)
packages/game test:    Start at  05:49:25
packages/game test:    Duration  5.21s (transform 4.28s, setup 1ms, collect 33.83s, tests 1.50s, environment 8ms, prepare 7.28s)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  ✓ test/fitToBounds.test.ts  (3 tests) 7ms
packages/client-web test:  ✓ test/hexLayout.test.ts  (2 tests) 16ms
packages/client-web test:  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 8ms
packages/client-web test:  ✓ test/controls-start-committee.test.tsx  (1 test) 45ms
packages/client-web test:  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 67ms
packages/client-web test:  ✓ test/action-panel.test.tsx  (3 tests) 66ms
packages/client-web test:  ✓ test/Board.test.tsx  (7 tests) 75ms
packages/client-web test:  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 83ms
packages/client-web test:  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 120ms
packages/client-web test:  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 123ms
packages/client-web test:  ✓ test/pending-choice-modal.test.tsx  (3 tests) 124ms
packages/client-web test:  ✓ test/selection-inspector.test.tsx  (2 tests) 143ms
packages/client-web test:  ✓ test/start-flow-mode-select.smoke.test.tsx  (1 test) 139ms
packages/client-web test:  ✓ test/lobby-screen.test.tsx  (3 tests) 224ms
packages/client-web test:  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 249ms
packages/client-web test:  ✓ test/no-game-src-imports.test.ts  (1 test) 7ms
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test:    Start at  05:49:31
packages/client-web test:    Duration  5.16s (transform 1.35s, setup 3ms, collect 14.28s, tests 1.50s, environment 36.17s, prepare 4.57s)
packages/client-web test: Done
```

### Commit Proof

#### `git show -1 --stat`

```text
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Tue Feb 17 05:53:33 2026 +0100

    task(0086): align formalize intent payload

- Emit committeeTileId in Formalize intents to match the Zod move contract

- Add regression test that reaches the Formalize gate and executes the emitted payload

 .../0086-FIX-legal-intents-formalize-payload.md    | 192 +++++++++++++++++++--
 packages/game/src/engine/legal-intents.ts          |   2 +-
 packages/game/test/legal-intents.test.ts           |  34 ++++
 3 files changed, 215 insertions(+), 13 deletions(-)
```
