# Codex Task 0083 - REF_MOVES: Invariants tests (enablement/order/duplicates tripwires)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0083
- **Area:** `packages/game` tests (moves assembly invariants)
- **Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`
- **Risk:** Low-medium (tests only; must be stable)

## 1) Context (frozen)

The hidden boss fight in moves refactoring is nondeterministic ordering + silent overwrites.
Once Task 0082 exists, the most valuable step is to add tripwire tests before touching helper dedupe or file splitting.

## 2) Goal (frozen)

Add deterministic invariants tests that fail loudly if future refactors reintroduce:

- state/zone-based enablement (instead of match config)
- nondeterministic module ordering
- silent overwrites / duplicates being accepted

## 3) Non-goals (frozen)

- No changes to move logic
- No changes to resolver logic

## 4) Inputs (frozen)

- Task 0081 outputs (canonical module list)
- Task 0082 outputs (MoveModuleRegistry)
- Existing test harness in `packages/game/test/*`

## 5) Outputs (frozen)

Add tests validating at minimum:

1) Disabled expansion registers nothing (flag=false contributes no moves)
2) Ordering invariant: module order equals canonical order list filtered by enablement
3) Duplicate move key fails deterministically (assert stable error message)

## 6) Constraints (frozen)

- Tests must be deterministic and non-flaky (no reliance on env or iteration side effects)
- Prefer small, direct tests over broad snapshots

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-012)
- AGENTS: 5.1-5.3 (tests + determinism expectations)

## 8) Acceptance Criteria (frozen)

- Tests fail on regression for enablement/order/duplicates
- Entire test suite passes

## 9) PR Checklist (frozen)

- [ ] Tripwire tests added (disabled contributes nothing, canonical order, deterministic duplicate error)
- [ ] Tests are stable (no flakiness)
- [ ] Tests pass
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

### Commands Run

TBD
