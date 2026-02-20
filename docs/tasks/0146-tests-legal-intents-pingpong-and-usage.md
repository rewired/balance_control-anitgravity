# Codex Task 0146 — TESTS: Cover Ping-Pong penalty + usage gating for `enumerateLegalIntents`

**Date:** 2026-02-20  
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0146
- **Owner:** Codex
- **Area:** `packages/game/test/legal-intents.test.ts`
- **Priority:** P1
- **Risk:** Low (tests only)
- **Branch name:** `task/0146-tests-legal-intents-pingpong-and-usage`
- **Skills:** S04 (Determinism Guard), S08 (PR Hygiene)

## 1) Guardrails (frozen)

- **GR-003 (Determinism Contract):** tests must assert deterministic intent ordering and stable selection.
- **GR-004 (Single Legal Action Interface):** tests must validate legality via `enumerateLegalIntents(...)` rather than re-implementing legality.
- **GR-013 (Bot Contract):** intents returned must be executable (no INVALID_MOVE surprises).

## 2) Spec anchors (frozen)

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-003, GR-004, GR-013.
- `packages/game/src/engine/resolver/costs.ts` — Ping-Pong penalty definition (CORE-01-04-12B) and extra cost slots.
- `packages/game/src/moves/stages/politicalAction.ts` — move behavior for `moveInfluence` and usage checks.

## 3) Context (frozen)

We need regression coverage for two common failure modes:

- **Ping-Pong penalty**: `moveInfluence` can require paying resources to Noise, and the move currently demands an explicit `extraResourceIds` list when costs apply.
- **Usage gating**: Enumeration must not surface political intents after the player has already spent their political action for the turn.

Without tests, these regressions can silently return and break bot/UI execution.

## 4) Goal (frozen)

- Add targeted tests that fail on:
  - `moveInfluence` intents missing required payment selection.
  - Political intents appearing when usage limit is exhausted.

## 5) Scope (frozen)

### 5.1 In-scope

- Extend `packages/game/test/legal-intents.test.ts` with two new describe blocks:
  1) Ping-Pong penalty case produces executable `moveInfluence` intent(s).
  2) Usage exhausted case produces no political intents.

### 5.2 Out-of-scope

- E2E UI tests.
- Changing move logic or spec semantics.

## 6) Plan (frozen)

### Steps

1) **Ping-Pong penalty test fixture**
   - Create a small, explicit state setup:
     - At least two board tiles (`sourceId`, `targetId`) with adjacency `sourceId -> targetId`.
     - An Influence owned by player `0` located on `sourceId`.
     - MetaMarker for player `0` placed on `targetId` and set to `mode='PingPong'`.
     - Ensure player supply has >= 2 resources so penaltyCount >= 1.
   - Call `enumerateLegalIntents(G, ctx, '0')` for `politicalAction` stage.
   - Assert:
     - There exists a `moveInfluence` intent from `sourceId` to `targetId`.
     - Its payload includes `extraResourceIds` with length >= 1.
   - Execute the intent through `CoreMoves.moveInfluence(...)` and assert it does not return `INVALID_MOVE`.

2) **Usage exhausted gating test fixture**
   - Setup a state where `EffectResolver.checkUsageLimit(..., 'politicalAction')` would be false.
     - Use the canonical usage store on `G.engine.attributes.usage` (same structure used by resolver).
     - Mark the current player as having already used politicalAction once this turn.
   - Call `enumerateLegalIntents(...)` for `politicalAction` stage.
   - Assert: no intents with moveType in `{ placeInfluence, moveInfluence, formalizeInfluence, convertResources }`.

3) **Determinism assertions**
   - For the Ping-Pong case, call enumeration twice and assert exact deep equality on intents (or at least payload equality for the targeted intent).

### Exit criteria

- New tests fail against the pre-fix code and pass after Task 0145 implementation.

## 7) Acceptance Criteria (frozen)

- `pnpm -C packages/game test -- legal-intents.test.ts` passes.
- Ping-Pong penalty test proves the returned intent is executable.
- Usage exhausted test proves political intents are omitted.

## 8) Files likely touched (frozen)

- `packages/game/test/legal-intents.test.ts`

## 9) Notes / hazards (frozen)

- Keep the fixture minimal and explicit; do not depend on draw pile randomness.
- Ensure any added IDs are deterministic and do not rely on object insertion order.

## 10) PR Checklist (to be completed before merge)

- [ ] Tests added and pass
- [ ] No production logic changes in this task
- [ ] `pnpm -w test` passes

## 11) Work Summary (fill after implementation)

-

## 12) Commands Run (fill after implementation)

-

## 13) Postflight (fill after implementation)

-

## 14) Patch Notes (fill after implementation)

-
