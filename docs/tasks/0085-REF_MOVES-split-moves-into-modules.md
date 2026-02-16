# Codex Task 0085 - REF_MOVES: Split moves.ts into stage/domain modules (mechanical)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0085
- **Area:** `packages/game` moves organization
- **Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`
- **Risk:** Medium-high (mechanical move across files; reviewability concerns)

## 1) Context (frozen)

`packages/game/src/moves.ts` (~460 LOC) mixes helpers + multiple move implementations across stages.
After ordering/enablement invariants are locked (0081-0083) and shared helpers are deduped (0084), we can safely split files to improve readability.

## 2) Goal (frozen)

Mechanically split `moves.ts` into smaller modules grouped by stage/domain, while keeping:

- public move keys and signatures unchanged
- behavior unchanged
- rule anchor comments colocated with the logic they justify
- no formatting churn beyond required imports/exports

## 3) Non-goals (frozen)

- Do not redesign the game to eliminate direct mutations inside moves in this task
- Do not change legality rules, costs, effect queueing, or events flow

## 4) Inputs (frozen)

- `packages/game/src/moves.ts`
- Task 0081-0084 outputs (deterministic assembly + tripwire tests + shared helpers)
- Existing tests (including golden replay, if applicable to moves)

## 5) Outputs (frozen)

- Split move modules under a new folder (example only):
  - `packages/game/src/moves/index.ts` (thin entry/export)
  - `packages/game/src/moves/stages/drawAndPlace.ts`
  - `packages/game/src/moves/stages/politicalAction.ts`
  - `packages/game/src/moves/system/resolveChoice.ts`
- `packages/game/src/moves.ts` reduced to a thin re-export or replaced by the new index (choose minimal churn)

## 6) Constraints (frozen)

- Mechanical move: avoid reformatting unrelated code
- Preserve determinism and stage flow
- Keep diffs reviewable (no mass prettier churn)

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-006 (Pending Choice Gate)
- GR-005 (No Phantom Moves)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-006)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (legal move surface)
- `docs/rules/000-core.md` (rule anchors referenced by move comments; must remain attached)

## 8) Acceptance Criteria (frozen)

- Entry file is thin; move logic is grouped by stage/domain
- Rule anchor comments moved with their functions (no anchor loss)
- No behavior changes (all tests pass; golden replay expectations unchanged if present)
- No silent overwrites possible (registry remains in effect)

## 9) PR Checklist (frozen)

- [ ] Moves split is mechanical and reviewable (minimal formatting churn)
- [ ] Entry/exports are thin and readable
- [ ] Rule anchors preserved and colocated
- [ ] Tests pass (including golden replay if present)
- [ ] Registry invariants still enforced (no silent overwrites)
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

### Commands Run

TBD
