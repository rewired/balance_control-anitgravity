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

- [ ] Introduce a factory export in `@balance-control/game`, e.g.:
  - `export function createBalanceControlGame(): Game<GameState>`
- [ ] The factory must build the move maps **at call time**, not at module import time.
- [ ] The factory must include a stable superset of moves:
  - core moves (as today)
  - plus any registered expansion moves (even if expansions are disabled in match config; legality gating handles that).
- [ ] Update server/client/bot to use the factory instead of importing a pre-built `BalanceControl` constant.

*(If you keep `export const BalanceControl`, it must either become a deprecated alias to the factory **without** creating import-time footguns, or be removed. Choose the least risky approach and keep API clarity.)*

### Tests

- [ ] Add/extend tests to prevent regression:
  - A test that registers a tiny “test expansion” with a unique move id and asserts the factory-produced Game includes that move in the correct stage/move map.
  - Ensure move-module registry still throws deterministically on duplicate move ids.
- [ ] Existing tests continue to pass, including golden replays.

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

- [ ] No move maps are built using `DEFAULT_GAME_CONFIG` at module import time.
- [ ] Server, client-web, and bot all use the same factory-built Game definition.
- [ ] A regression test proves the factory includes registered expansion moves without relying on import order.
- [ ] `pnpm -r test` passes (including golden replays).

## 9) PR Checklist (frozen)

- [ ] Factory exists and is the canonical way to obtain the Game object
- [ ] Cross-package imports updated (server/client/bot)
- [ ] Registry/no-override invariants still enforced
- [ ] Tests pass (`pnpm -r test`)
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- 

### Commands Run

- 

### Postflight Proof

- 
