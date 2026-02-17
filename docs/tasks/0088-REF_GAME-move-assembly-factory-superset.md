# Codex Task 0088 - REF_GAME: Move assembly must not depend on DEFAULT_GAME_CONFIG at import time

**Date:** 2026-02-17
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0088
- **Area:** `packages/game` move assembly + cross-package wiring (server/client/bot)
- **Recommended execution order:** after 0087 (single canonical Game definition)
- **Risk:** Medium-high (public API + wiring across packages)

## 1) Context (frozen)

Move modularization and registry work is in good shape (0076–0085), but there is still a structural trap:

`packages/game/src/index.ts` currently builds the move maps at module evaluation time using:

- `getEnabledMoveModules(DEFAULT_GAME_CONFIG)` (default expansion flags are all false)

This means:
- Any per-match config derived from `setupData` (stored in `G.meta.cfg`) cannot influence which move modules are present.
- If expansions ever add moves, they will never become available unless we rebuild the Game object.
- This violates the intent behind GR-012 (“Match Config is Canonical”), and it also makes future expansion work easy to get subtly wrong.

Important nuance (frozen fact):
- As of this repo snapshot, expansion definitions appear to provide **zero** `moves` in their `ExpansionDefinition` objects. So this is mostly a **forward-looking correctness fix**, but the plumbing is already present and should not be left in a broken state.

## 2) Goal (frozen)

- Stop building move maps based on `DEFAULT_GAME_CONFIG` at import time.
- Provide a deterministic, safe way to construct the boardgame.io Game object such that:
  - the move surface is a **superset** (core + any registered expansion moves),
  - actual legality remains gated by `enumerateLegalIntents(...)`, `EffectResolver` and the match config in `G.meta.cfg`,
  - module ordering and no-override invariants remain enforced.

## 3) Non-goals (frozen)

- Do not implement new expansion moves in this task.
- Do not change turn structure or stage names.
- Do not change how `SetupGame` normalizes and stores `G.meta.cfg`.

## 4) Inputs (frozen)

- `packages/game/src/index.ts` (current Game object construction)
- `packages/game/src/move-assembly.ts` (already supports assembly by config)
- `packages/game/src/expansion-registry.ts` (registry + canonical ordering)
- Consumers:
  - `packages/server/src/index.ts`
  - `packages/client-web/src/App.tsx`
  - `packages/client-web/src/hotseat/HotseatShell.tsx`
  - `packages/bot-llm/src/index.ts`

## 5) Outputs (frozen)

### Code

- [x] Introduce a factory export in `@balance-control/game`, e.g.:
  - `export function createBalanceControlGame(): Game<GameState>`
- [x] The factory must build the move maps **at call time**, not at module import time.
- [x] The factory must include a stable superset of moves:
  - core moves (as today)
  - plus any registered expansion moves (even if expansions are disabled in match config; legality gating handles that).
- [x] Update server/client/bot to use the factory instead of importing a pre-built `BalanceControl` constant.

*(If you keep `export const BalanceControl`, it must either become a deprecated alias to the factory **without** creating import-time footguns, or be removed. Choose the least risky approach and keep API clarity.)*

### Tests

- [x] Add/extend tests to prevent regression:
  - A test that registers a tiny “test expansion” with a unique move id and asserts the factory-produced Game includes that move in the correct stage/move map.
  - Ensure move-module registry still throws deterministically on duplicate move ids.
- [x] Existing tests continue to pass, including golden replays.

## 6) Constraints (frozen)

- Determinism: move map ordering must remain canonical and stable.
- Expansion isolation: disabled expansions must not mutate state; only widen the move surface.
- No phantom moves: do not introduce new core actions.
- Avoid reliance on import order across packages; wiring should be explicit and robust.

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-012 (Match Config is Canonical)
- GR-002 (Engine-only Rule Execution)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-012, GR-002)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (client is presentation-only; engine authority)
- `docs/rules/000-core.md` (turn structure + stage legality; referenced by move comments)

## 8) Acceptance Criteria (frozen)

- [x] No move maps are built using `DEFAULT_GAME_CONFIG` at module import time.
- [x] Server, client-web, and bot all use the same factory-built Game definition.
- [x] A regression test proves the factory includes registered expansion moves without relying on import order.
- [x] `pnpm -r test` passes (including golden replays).

## 9) PR Checklist (frozen)

- [x] Factory exists and is the canonical way to obtain the Game object
- [x] Cross-package imports updated (server/client/bot)
- [x] Registry/no-override invariants still enforced
- [x] Tests pass (`pnpm -r test`)
- [x] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- Added `createBalanceControlGame()` factory and removed import-time move assembly from `DEFAULT_GAME_CONFIG`.
- Assembled a deterministic superset move surface (core + all registered expansion moves) while keeping canonical ordering and no-override invariants.
- Updated server, client-web, and bot wiring to register expansions first, then call the factory.
- Added regression tests for factory superset inclusion and deterministic duplicate-move failure.
- Updated replay + affected tests to use the factory.

### Commands Run

- `git checkout -b task/0088-move-assembly-factory-superset` (ok)
- `pnpm install` (ok)
- `$env:NO_COLOR=1; pnpm -r test` (ok; game + client-web)
- `git status` (ok)
- `git diff --stat` (ok)
- `git add -A` (ok)
- `git commit --amend ...` (ok; single commit)
- `git show -1 --stat` (ok)

### Postflight Proof

- `git status`
```text
On branch task/0088-move-assembly-factory-superset
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/tasks/0088-REF_GAME-move-assembly-factory-superset.md
	modified:   packages/bot-llm/package.json
	modified:   packages/bot-llm/src/index.ts
	modified:   packages/client-web/package.json
	modified:   packages/client-web/src/App.tsx
	modified:   packages/client-web/src/components/LobbyScreen.tsx
	modified:   packages/client-web/src/hotseat/HotseatShell.tsx
	modified:   packages/game/src/expansion-registry.ts
	modified:   packages/game/src/index.ts
	modified:   packages/game/src/move-assembly.ts
	modified:   packages/game/src/replay.ts
	modified:   packages/game/test/golden-replay.test.ts
	modified:   packages/game/test/move-assembly-invariants.test.ts
	modified:   packages/game/test/player-view.test.ts
	modified:   packages/game/test/server-smoke.test.ts
	modified:   packages/game/test/turn.test.ts
	modified:   packages/server/src/index.ts
	modified:   pnpm-lock.yaml

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	packages/client-web/src/game.ts

no changes added to commit (use "git add" and/or "git commit -a")
```

- `git diff --stat`
```text
 ...0088-REF_GAME-move-assembly-factory-superset.md | 116 +++++++++--
 packages/bot-llm/package.json                             |   6 +-
 packages/bot-llm/src/index.ts                             |  10 +-
 packages/client-web/package.json                          |   3 +
 packages/client-web/src/App.tsx                    |   7 +-
 packages/client-web/src/components/LobbyScreen.tsx |   3 +-
 packages/client-web/src/hotseat/HotseatShell.tsx   |   7 +-
 packages/game/src/expansion-registry.ts            |  13 ++
 packages/game/src/index.ts                         | 225 +++++++++++----------
 packages/game/src/move-assembly.ts                 |  31 +++
 packages/game/src/replay.ts                        |   5 +-
 packages/game/test/golden-replay.test.ts           |   5 +-
 .../game/test/move-assembly-invariants.test.ts     |  35 +++-
 packages/game/test/player-view.test.ts             |  13 +-
 packages/game/test/server-smoke.test.ts            |   4 +-
 packages/game/test/turn.test.ts                    |   3 +-
 packages/server/src/index.ts                       |   3 +-
 pnpm-lock.yaml                                     |  18 ++
 18 files changed, 351 insertions(+), 156 deletions(-)
```

- `$env:NO_COLOR=1; pnpm -r test` (output truncated by harness)
```text
Scope: 9 of 10 workspace projects
packages/game test$ vitest run
packages/game test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/game
packages/game test:  ✓ test/spec-anchor-tripwire.test.ts  (1 test) 85ms
packages/game test:  ✓ test/setup.test.ts  (8 tests) 24ms
packages/game test:  ✓ test/move-assembly-invariants.test.ts  (5 tests) 6ms
packages/game test:  Test Files  28 passed (28)
packages/game test:       Tests  109 passed (109)
packages/game test: Done
packages/client-web test$ vitest run
packages/client-web test:  RUN  v0.30.1 D:/__DEV/balance_control-anitgravity/packages/client-web
packages/client-web test:  Test Files  16 passed (16)
packages/client-web test:       Tests  48 passed (48)
packages/client-web test: Done
```

- `git show -1 --stat`
```text
Author: Björn Ahlers <rewired.de@gmail.com>
Date:   Tue Feb 17 06:29:35 2026 +0100

    task(0088): build Game via factory move superset

- Export createBalanceControlGame() to assemble moves at call time from registered modules
- Extend move assembly/registry to support a deterministic superset surface
- Update server, client-web, and bot to register expansions then call the factory
- Add regression tests for superset inclusion and deterministic duplicate detection

 ...0088-REF_GAME-move-assembly-factory-superset.md | 152 ++++++++++++--
 packages/bot-llm/package.json                      |   6 +-
 packages/bot-llm/src/index.ts                      |  10 +-
 packages/client-web/package.json                   |   3 +
 packages/client-web/src/App.tsx                    |   7 +-
 packages/client-web/src/components/LobbyScreen.tsx |   3 +-
 packages/client-web/src/game.ts                    |  12 ++
 packages/client-web/src/hotseat/HotseatShell.tsx   |   7 +-
 packages/game/src/expansion-registry.ts            |  13 ++
 packages/game/src/index.ts                         | 225 +++++++++++----------
 packages/game/src/move-assembly.ts                 |  31 +++
 packages/game/src/replay.ts                        |   5 +-
 packages/game/test/golden-replay.test.ts           |   5 +-
 .../game/test/move-assembly-invariants.test.ts     |  35 +++-
 packages/game/test/player-view.test.ts             |  13 +-
 packages/game/test/server-smoke.test.ts            |   4 +-
 packages/game/test/turn.test.ts                    |   3 +-
 packages/server/src/index.ts                       |   3 +-
 pnpm-lock.yaml                                     |  18 ++
 19 files changed, 399 insertions(+), 156 deletions(-)
```
