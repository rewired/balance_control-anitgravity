# Codex Task 0147 — ENGINE: Add deterministic intent budget cap to `enumerateLegalIntents`

**Date:** 2026-02-20  
**Primary contract:** AGENTS.md (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0147
- **Owner:** Codex
- **Area:** `packages/game/src/engine/legal-intents.ts`
- **Priority:** P2
- **Risk:** Medium (can hide some legal moves if cap is too small; must be deterministic)
- **Branch name:** `task/0147-engine-legal-intents-intent-budget-cap`
- **Skills:** S04 (Determinism Guard), S05 (Boundary Check)

## 1) Guardrails (frozen)

- **GR-003 (Determinism Contract):** truncation must be deterministic and stable across runs.
- **GR-004 (Single Legal Action Interface):** enumeration remains the sole legal action source.
- **GR-013 (Bot Contract):** bot must receive a consistent subset (stable ordering) when capped.

## 2) Spec anchors (frozen)

- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` — legality enumeration is engine-owned and pure.
- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` — GR-003, GR-004, GR-013.

## 3) Context (frozen)

Some actions (notably conversion/formalization with payment permutations) can yield a large number of intents.
That’s dangerous for:

- UI responsiveness (rendering and filtering thousands of intents)
- Bot selection time
- Network payload size if intents are ever surfaced remotely

We need a **hard safety cap** that prevents runaway enumeration, while preserving determinism.

## 4) Goal (frozen)

- Add an internal, deterministic cap on total intents returned by `enumerateLegalIntents(...)`.
- Truncation must be based on canonical sort order (so the same state always yields the same subset).

## 5) Scope (frozen)

### 5.1 In-scope

- Introduce a constant (e.g. `LEGAL_INTENT_BUDGET = 1500`) in `legal-intents.ts`.
- After `sortIntents(...)`, apply `slice(0, LEGAL_INTENT_BUDGET)`.
- Add a small unit test that forces intent explosion and asserts:
  - count equals the cap
  - output is identical across two calls

### 5.2 Out-of-scope

- Adding a new API parameter for budgets.
- Implementing a “paged” legal intent protocol.

## 6) Plan (frozen)

### Steps

1) **Add budget constant**
   - Choose a default value that is safe but not tiny (target: 500–2000).
   - Keep it local to `legal-intents.ts` (no config surface change).

2) **Apply cap at the final return**
   - Ensure sorting happens before truncation.
   - Preserve current behavior when intent count is below the cap.

3) **Add regression test**
   - Build a test state with many resources and a single action that enumerates many combinations (e.g. convertResources with multiple input choices).
   - Assert the cap triggers and is deterministic.

### Exit criteria

- Enumeration is bounded in worst-case states and still deterministic.

## 7) Acceptance Criteria (frozen)

- When intent count exceeds the cap, `enumerateLegalIntents(...)` returns exactly `LEGAL_INTENT_BUDGET` intents.
- For the same state, two calls return identical arrays.
- `pnpm -w test` passes.

## 8) Files likely touched (frozen)

- `packages/game/src/engine/legal-intents.ts`
- `packages/game/test/legal-intents.test.ts` (new test)

## 9) Notes / hazards (frozen)

- Cap must be applied after canonical sorting; never truncate an unsorted list.
- If the cap hides critical actions during normal play, lower-risk follow-up is to add per-move caps (separate task).

## 10) PR Checklist (to be completed before merge)

- [ ] Deterministic cap applied (sorted then sliced)
- [ ] Regression test added
- [ ] `pnpm -w test` passes

## 11) Work Summary (fill after implementation)

-

## 12) Commands Run (fill after implementation)

-

## 13) Postflight (fill after implementation)

-

## 14) Patch Notes (fill after implementation)

-
