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

- [ ] Entrypoints register CorePack first
- [ ] Test helper added and adopted
- [ ] Regression coverage added for wiring
- [ ] Docs updated (boot contract)
- [ ] `pnpm -r test` passes
- [ ] Task file updated with execution log

## 15) Execution Log (append-only)

### Work Summary

- ...

### Commands Run

- ...

### Postflight Proof

- `git status`
- `pnpm -r test`
