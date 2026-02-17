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

- [ ] Update `enumerateFormalize(...)` to emit `committeeTileId` (not `tileId`).

### Tests

- [ ] Extend `packages/game/test/legal-intents.test.ts` with a scenario that:
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

- [ ] `enumerateLegalIntents(...)` emits `formalizeInfluence` payloads that validate against `formalizeInfluencePayloadSchema`.
- [ ] New/extended `legal-intents.test.ts` fails on main before the fix and passes after the fix.
- [ ] No other intent payload shapes change.

## 9) PR Checklist (frozen)

- [ ] Payload contract is aligned across: intent enumeration → Zod schema → move implementation
- [ ] No rule/logic changes beyond the payload key rename
- [ ] Tests pass (`pnpm -r test`)
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

- 

### Commands Run

- 

### Postflight Proof

- 
