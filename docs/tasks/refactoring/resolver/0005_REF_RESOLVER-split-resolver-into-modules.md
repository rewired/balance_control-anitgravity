# Codex Task 0005_REF_RESOLVER - Split resolver.ts into modules (mechanical move, preserve anchors)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0005
- **Area:** Refactor for readability (mechanical split)
- **Risk:** Medium-high (large file moves; must preserve behavior, determinism, and rule anchors)

## 1) Context (frozen)

`packages/game/src/engine/resolver.ts` is large and mixes concerns (queue runner, modifiers, costs, and many atom handlers).
We want to improve readability by splitting into focused modules while keeping:

- one canonical resolver pipeline
- deterministic behavior
- rule anchor comments moving with the logic they justify

## 2) Goal (frozen)

Mechanically split `resolver.ts` into modules:

- `resolver.ts`: orchestrator + dispatch only
- atom handlers moved into `engine/atoms/*` grouped by domain (resource/influence/measure/regulation/countdown/production/hotspot/rules/choice)
- shared helpers extracted (hooks/modifiers, deterministic ids, cost logic as appropriate)

All semantic behavior remains unchanged.

## 3) Non-goals (frozen)

- No rules changes
- No functional changes to atom semantics, costs, production, or majority behavior
- No reformatting-only churn beyond what is required by file moves/imports

## 4) Inputs (frozen)

- `packages/game/src/engine/resolver.ts`
- `packages/game/src/engine/types.ts`
- `packages/game/src/engine/selectors.ts`
- `packages/game/src/expansion-registry.ts`
- Tests in `packages/game/test/*` (especially golden replay)

## 5) Outputs (frozen)

- New engine modules under `packages/game/src/engine/` that reduce resolver.ts size substantially
- Rule-anchor comments preserved and relocated with code
- All tests passing

## 6) Constraints (frozen)

- Must preserve canonical resolver order (no pipeline reordering)
- Must preserve determinism (stable ordering, seeded RNG usage only)
- Must not introduce alternative state mutation paths outside resolver

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-007 (Effect CPU Resolution Order)
- GR-009 (Zone Invariants)
- GR-011 (Production Canon)

### spec_anchor_refs

- `docs/architecture/ARCH-03-MEASURE-CPU.md` (resolver CPU model)
- `docs/architecture/ARCH-02-STATE-SHAPE.md` (zone invariants and expansion isolation)
- `docs/rules/000-core.md` (rule anchors referenced by code - must remain attached)
- AGENTS: 0.2, 0.5, 3.5, 3.6

## 8) Acceptance Criteria (frozen)

- `resolver.ts` becomes primarily orchestration + dispatch (no large domain logic blocks)
- Atom behavior is unchanged (golden replay remains identical)
- Rule anchors remain present, accurate, and colocated with logic
- All tests pass

## 9) PR Checklist (frozen)

- [ ] `resolver.ts` split into focused modules
- [ ] Rule anchor comments moved with logic (no anchor loss)
- [ ] No semantic changes (golden replay unchanged)
- [ ] Determinism preserved
- [ ] All tests pass
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

### Commands Run

TBD

