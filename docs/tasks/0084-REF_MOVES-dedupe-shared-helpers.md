# Codex Task 0084 - REF_MOVES: Dedupe shared helpers (moves + resolver)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0084
- **Area:** Shared helper utilities (within `packages/game`)
- **Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`
- **Risk:** Medium (risk of circular deps; must be mechanical)

## 1) Context (frozen)

`packages/game/src/moves.ts` duplicates low-level helpers also present in the resolver, notably:

- player meta marker lookup
- object zone lookup

We want to centralize shared helpers so both moves and resolver can import the same deterministic implementation.

## 2) Goal (frozen)

Create a shared helper module and replace duplicated implementations in both moves and resolver where applicable, without semantic changes.

## 3) Non-goals (frozen)

- No changes to any move legality/cost/effect logic
- No changes to resolver behavior
- No changes to state shape

## 4) Inputs (frozen)

- `packages/game/src/moves.ts` (duplicated helpers)
- `packages/game/src/engine/resolver.ts` (duplicated helpers)

## 5) Outputs (frozen)

- Shared helper module(s) located to avoid circular imports
- Moves imports shared helpers instead of local copies
- Resolver imports the same helpers where applicable

## 6) Constraints (frozen)

- Avoid circular dependencies (moves must not import resolver, resolver must not import moves)
- Helpers must be deterministic and side-effect free
- Keep changes mechanical (minimal rename churn)

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003)
- AGENTS: 0.2 (determinism), 0.4 (keep repo clean)

## 8) Acceptance Criteria (frozen)

- Duplicated helper implementations are removed for the targeted helpers
- No circular dependency introduced
- All tests pass and behavior is unchanged

## 9) PR Checklist (frozen)

- [ ] Shared helper module added (no cycles)
- [ ] Moves uses shared helper (no duplicates)
- [ ] Resolver uses shared helper where applicable
- [ ] No semantic changes
- [ ] Tests pass
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

### Commands Run

TBD
