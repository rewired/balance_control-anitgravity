# Codex Task 0095 - REF_PACKS: Register CorePack in all entrypoints (server/client/bot/tests)

**Date:** 2026-02-17
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0095
- **Area:** cross-package wiring (server/client-web/bot) + tests
- **Recommended execution order:** after 0094 (core guard exists)
- **Risk:** Medium (wiring drift + test setup)

## 1) Context (frozen)

After 0094, `createBalanceControlGame()` should fail fast unless the mandatory core pack is registered.

Today, entrypoints only register numbered expansions:

- `packages/client-web/src/game.ts`
- `packages/server/src/index.ts`
- `packages/bot-llm/src/index.ts`

Tests also register expansions ad-hoc, and may use `ExpansionRegistry.clear()` between runs.

We need one consistent rule:

> Every runtime must register CorePack exactly once before creating the Game object.

## 2) Goal (frozen)

Make core pack registration explicit, consistent, and hard to forget:

- update all entrypoints to register CorePack before expansions
- provide a test helper that ensures CorePack is registered for all game tests
- prevent subtle “some tests pass, runtime fails” drift

## 3) Non-goals (frozen)

- Do not change gameplay or UI.
- Do not change how expansion flags are stored or parsed.
- Do not introduce new expansions or new moves.

## 4) Inputs (frozen)

- `packages/game/src/packs/core/index.ts` (CorePack)
- Pack registry export from `@balance-control/game`
- Entrypoints:
  - `packages/client-web/src/game.ts`
  - `packages/server/src/index.ts`
  - `packages/bot-llm/src/index.ts`
- Tests:
  - anything using the registry (e.g. `packages/game/test/*.test.ts`)

## 5) Outputs (frozen)

### A) Entry point wiring

Update:

1) `packages/client-web/src/game.ts`
2) `packages/server/src/index.ts`
3) `packages/bot-llm/src/index.ts`

So that registration order is explicit:

- `EnginePackRegistry.registerPack(CorePack)` first
- then `registerPack(Expansion01/02/03)` (or legacy register if still supported)

If the public API still exports `ExpansionRegistry`, update to use the new preferred name (but keep compatibility if required by other packages).

### B) Test helper

Create a helper for tests, e.g.:

- `packages/game/test/_helpers/registerPacks.ts`

It should:
- clear registry
- register CorePack
- (optionally) register default expansions used by tests

Then update tests to call this helper in `beforeEach()` (or at least in each file that uses the registry), so they don't accidentally rely on execution order.

### C) Regression tests

Add a small cross-package smoke test (or extend existing ones) to ensure:

- server and bot entrypoints register CorePack before factory call (can be asserted via importing and checking registry state, or by running their boot functions in a test harness without actually starting network listeners).

Keep it minimal and deterministic.

### D) Docs / hygiene

- Update `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` or `AGENTS.md` (choose one) with a short “Boot contract” note:
  - “CorePack must be registered before createBalanceControlGame().”
- Update any references to “ExpansionRegistry” where it is now misleading (optional but preferred if low-risk).

## 6) Constraints (frozen)

- Avoid import-order dependency traps: registration should be in a single, obvious place per runtime.
- Keep backward compatibility where possible, but prefer the new pack naming.
- Do not start servers or require network during tests.

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json`
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md`
- `docs/architecture/ARCH-04-LLM-BOT-CONTRACT.md`

## 8) Acceptance Criteria (frozen)

- CorePack is registered explicitly in:
  - client-web
  - server
  - bot-llm
- Game tests register CorePack via a shared helper (no drift).
- Full test suite passes (`pnpm -r test`).
- Docs updated with the boot contract note.

## 9) PR Checklist (frozen)

- [x] Entrypoints register CorePack first
- [x] Test helper added and adopted
- [x] Regression coverage added for wiring
- [x] Docs updated (boot contract)
- [x] `pnpm -r test` passes
- [x] Task file updated with execution log

## 15) Execution Log (append-only)

### Work Summary

- ...
- Added boot helpers for server and bot entrypoints to register CorePack before game creation.
- Updated client-web entrypoint to register CorePack ahead of expansions.
- Added a shared test pack registration helper and refactored game tests to use it.
- Added an entrypoint wiring regression test for server and bot boot functions.
- Updated ARCH-01 to include the boot contract note.

### Commands Run

- ...
- `pnpm -r test` (OK)
- `pnpm lint` (OK)
- `git status` (OK)
- `git diff --stat` (OK)
- `git show -1 --stat` (OK)

### Postflight Proof

- `git status`
- `pnpm -r test`
- `git diff --stat`
- `git show -1 --stat`

#### `git status`

```
## task/0095-registlear
 M docs/architecture/ARCH-01-ENGINE-CONTRACT.md
 M docs/tasks/0095-REF_PACKS-entrypoints-register-core-pack.md
 M packages/bot-llm/src/index.ts
 M packages/client-web/src/game.ts
 M packages/game/test/convert-resources-real-setup.test.ts
 M packages/game/test/determinism-policy.test.ts
 M packages/game/test/exp01-controller-grants-no-throw.test.ts
 M packages/game/test/exp02-controller-grants-no-throw.test.ts
 M packages/game/test/exp02-hotspot-ids.test.ts
 M packages/game/test/exp03-controller-grants-no-throw.test.ts
 M packages/game/test/expansion.test.ts
 M packages/game/test/golden-replay.test.ts
 M packages/game/test/legal-intents.test.ts
 M packages/game/test/measure-deck-provider.test.ts
 M packages/game/test/move-assembly-invariants.test.ts
 M packages/game/test/player-view.test.ts
 M packages/game/test/replay-runner.test.ts
 M packages/game/test/server-smoke.test.ts
 M packages/game/test/setup.test.ts
 M packages/game/test/turn.test.ts
 M packages/game/test/unplaceable-draw-redraw.test.ts
 M packages/server/src/index.ts
?? packages/bot-llm/src/boot.ts
?? packages/game/test/_helpers/
?? packages/game/test/entrypoint-pack-wiring.test.ts
?? packages/server/src/boot.ts
```

#### `git diff --stat`

```
 docs/architecture/ARCH-01-ENGINE-CONTRACT.md                |   3 +++
 docs/tasks/0095-REF_PACKS-entrypoints-register-core-pack.md | 185 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-----
 packages/bot-llm/src/index.ts                               |  11 ++------
 packages/client-web/src/game.ts                             |  19 +++++++++-----
 packages/game/test/convert-resources-real-setup.test.ts     |   6 ++---
 packages/game/test/determinism-policy.test.ts               |   6 ++---
 packages/game/test/exp01-controller-grants-no-throw.test.ts |   8 +++---
 packages/game/test/exp02-controller-grants-no-throw.test.ts |   8 +++---
 packages/game/test/exp02-hotspot-ids.test.ts                |   8 +++---
 packages/game/test/exp03-controller-grants-no-throw.test.ts |   8 +++---
 packages/game/test/expansion.test.ts                        |   3 ++-
 packages/game/test/golden-replay.test.ts                    |  16 +++++-------
 packages/game/test/legal-intents.test.ts                    |   6 ++---
 packages/game/test/measure-deck-provider.test.ts            |   9 +++----
 packages/game/test/player-view.test.ts                      |   6 ++---
 packages/game/test/replay-runner.test.ts                    |   6 ++---
 packages/game/test/resolver.test.ts                         |  18 +++++++------
 packages/game/test/server-smoke.test.ts                     |   6 ++---
 packages/game/test/setup.test.ts                            |   7 +++--
 packages/game/test/turn.test.ts                             |   6 ++---
 packages/game/test/unplaceable-draw-redraw.test.ts          |   6 ++---
 packages/server/src/index.ts                                |  12 ++-------
 23 files changed, 252 insertions(+), 118 deletions(-)
```

#### `pnpm -r test`

```
(some characters truncated)...
 (6 tests) 120ms
│  ✓ test/legal-intents.test.ts  (7 tests) 36ms
│  ✓ test/determinism-policy.test.ts  (2 tests) 220ms
│  ✓ test/moves.test.ts  (22 tests) 21ms
│ stderr | test/moves.test.ts > Moves > placeInfluence should reject malformed payload without muta…
│ [move:placeInfluence] invalid payload: <root>: Expected object, received string
│  ✓ test/hotspot.test.ts  (3 tests) 18ms
│  ✓ test/player-view.test.ts  (3 tests) 16ms
│  ✓ test/replay-runner.test.ts  (3 tests) 56ms
│  ✓ test/turn.test.ts  (9 tests) 119ms
│ stderr | test/turn.test.ts > Turn Structure (Stages) > should reject placeTile during politicalAc…
│ ERROR: disallowed move: placeTile
│ stderr | test/turn.test.ts > Turn Structure (Stages) > should reject passTilePlacement when a sta…
│ ERROR: invalid move: passTilePlacement args: [object Object]
│  ✓ test/golden-replay.test.ts  (5 tests) 184ms
│ stderr | test/golden-replay.test.ts > Golden replays > should match golden hash for core_hotspot_…
│ ERROR: invalid move: placeInfluence args: [object Object]
│ stdout | test/golden-replay.test.ts > Golden replays > should match golden hash for core_plus_ex0…
│ EXP-01 Setup Complete.
│  ✓ test/server-smoke.test.ts  (1 test) 758ms
│  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 6ms
│  ✓ test/convert-resources-real-setup.test.ts  (2 tests) 12ms
│  ✓ test/exp03-controller-grants-no-throw.test.ts  (2 tests) 9ms
│  ✓ test/computeMajorirty.test.ts  (5 tests) 13ms
│  ✓ test/engine-pack-registry.test.ts  (5 tests) 7ms
│  ✓ test/engine-module-registry.test.ts  (1 test) 5ms
│  ✓ test/expansion.test.ts  (3 tests) 6ms
│ stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > routes EXP-02 measur…
│ EXP-02 Setup Complete.
│ stdout | test/measure-deck-provider.test.ts > Measure deck provider lookup > fails deterministica…
│ EXP-02 Setup Complete.
│  ✓ test/measure-deck-provider.test.ts  (4 tests) 9ms
│  ✓ test/setup.test.ts  (8 tests) 15ms
│  ✓ test/move-module-registry.test.ts  (1 test) 5ms
│  ✓ test/unplaceable-draw-redraw.test.ts  (2 tests) 12ms
│  ✓ test/core-pack-setup.test.ts  (1 test) 5ms
│  ✓ test/resolver-invariants.test.ts  (5 tests) 7ms
│  ✓ test/exp02-hotspot-ids.test.ts  (1 test) 7ms
│ stdout | test/exp02-hotspot-ids.test.ts > EXP-02 Inner Order hotspot id consistency > should reso…
│ EXP-02 Setup Complete.
│  ✓ test/controller-fallback-hardening.test.ts  (3 tests) 6ms
│  ✓ test/measure-deck-provider.test.ts  (4 tests) 14ms
│  ✓ test/expansion.test.ts  (3 tests) 8ms
│  ✓ test/move-module-registry.test.ts  (1 test) 3ms
│  ✓ test/production-uncontrolled.test.ts  (1 test) 4ms
│  ✓ test/move-assembly-invariants.test.ts  (6 tests) 6ms
│  Test Files  31 passed (31)
│       Tests  118 passed (118)
│    Start at  10:40:27
└─ Done in 42.8s0.46s (transform 6.86s, setup 1ms, collect 99.48s, tests 3.96s, environment 6ms, pr…
packages/client-web test$ vitest run
│  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
│  ✓ test/fitToBounds.test.ts  (3 tests) 16ms
│  ✓ src/ui/__tests__/intentViewModel.test.ts  (4 tests) 6ms
│  ✓ src/ui/tiles/__tests__/HexTileVisual.smoke.test.tsx  (9 tests) 93ms
│  ✓ test/controls-start-committee.test.tsx  (1 test) 37ms
│  ✓ test/action-panel.test.tsx  (3 tests) 57ms
│  ✓ test/Board.test.tsx  (7 tests) 47ms
│  ✓ test/drawpile-and-discard-ui.test.tsx  (2 tests) 68ms
│  ✓ test/hotseat-shell.smoke.test.tsx  (1 test) 62ms
│  ✓ test/public-notice-unplaceable.test.tsx  (2 tests) 127ms
│  ✓ test/start-flow-mode-select.smoke.test.tsx  (1 test) 138ms
│  ✓ test/lobby-session-persistence.test.tsx  (4 tests) 209ms
│  ✓ test/lobby-screen.test.tsx  (3 tests) 216ms
│  ✓ test/no-game-src-imports.test.ts  (1 test) 15ms
│  Test Files  16 passed (16)
│       Tests  48 passed (48)
│    Start at  10:41:10
└─ Done in 1m 6.6s13s (transform 2.68s, setup 2ms, collect 147.89s, tests 1.33s, environment 503.62…
```

#### `pnpm lint`

```
(TraeAI-3) D:\__DEV\balance_control-anitgravity [0:0] $ trae-sandbox 'pnpm lint'lit( , )
}
> balance-control-monorepo@0.0.0 lint D:\__DEV\balance_control-anitgravity                     5,1 12%
> eslint "packages/**/*.{ts,tsx,js,cjs,mjs}" "scripts/**/*.{js,cjs,mjs}" "*.{js,cjs,mjs}"
=============

WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree. You may find that it works just fine, or you may not.

SUPPORTED TYPESCRIPT VERSIONS: >=4.7.4 <5.6.0

YOUR TYPESCRIPT VERSION: 5.9.3

Please only submit bug reports when using the officially supported version.

=============
(TraeAI-3) D:\__DEV\balance_control-anitgravity [0:0] $
```

#### `git show -1 --stat`

```
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Tue Feb 17 10:50:58 2026 +0100

    task(0095): standardize pack registration wiring

- standardize pack registration in tests and entrypoints

- add shared pack registration helper and wiring checks

- document boot contract updates and execution log

 docs/architecture/ARCH-01-ENGINE-CONTRACT.md       |   3 +
 ...095-REF_PACKS-entrypoints-register-core-pack.md | 185 ++++++++++++++++++++-
 packages/bot-llm/src/boot.ts                       |  25 +++
 packages/bot-llm/src/index.ts                      |  11 +-
 packages/client-web/src/game.ts                    |  19 ++-
 packages/game/test/_helpers/registerPacks.ts       |  14 ++
 .../game/test/convert-resources-real-setup.test.ts |   6 +-
 packages/game/test/determinism-policy.test.ts      |   6 +-
 packages/game/test/entrypoint-pack-wiring.test.ts  |  31 ++++
 .../test/exp01-controller-grants-no-throw.test.ts  |   8 +-
 .../test/exp02-controller-grants-no-throw.test.ts  |   8 +-
 packages/game/test/exp02-hotspot-ids.test.ts       |   8 +-
 .../test/exp03-controller-grants-no-throw.test.ts  |   8 +-
 packages/game/test/expansion.test.ts               |   3 +-
 packages/game/test/golden-replay.test.ts           |  16 +-
 packages/game/test/legal-intents.test.ts           |   6 +-
 packages/game/test/measure-deck-provider.test.ts   |   9 +-
 .../game/test/move-assembly-invariants.test.ts     |   7 +-
 packages/game/test/replay-runner.test.ts           |   6 +-
 packages/game/test/resolver.test.ts                |  18 +-
 packages/game/test/server-smoke.test.ts            |   6 +-
 packages/game/test/setup.test.ts                   |   7 +-
 packages/game/test/turn.test.ts                    |   6 +-
 packages/game/test/unplaceable-draw-redraw.test.ts |   6 +-
 packages/server/src/boot.ts                        |  25 +++
 packages/server/src/index.ts                       |  12 +-
 27 files changed, 347 insertions(+), 118 deletions(-)
```

### Guardrails

- GR-003 (Determinism Contract)
- GR-012 (Match Config is Canonical)
