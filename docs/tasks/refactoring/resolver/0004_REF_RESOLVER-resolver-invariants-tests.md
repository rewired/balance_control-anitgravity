# Codex Task 0004_REF_RESOLVER - Resolver invariants tests (order, determinism, no-override)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0004
- **Area:** Test hardening for upcoming refactors
- **Risk:** Low-medium (tests only, but must be stable and non-flaky)

## 1) Context (frozen)

We are about to modularize resolver dispatch and split `resolver.ts`.
Before moving code, we need tests that fail loudly if we break:

- deterministic ordering
- canonical resolution ordering (prohibition/cost/payment/modifiers/mutation)
- no-override rule for atom handlers

## 2) Goal (frozen)

Add a small suite of focused invariants tests that act as refactor tripwires:

- deterministic handler registration behavior (no override, stable order)
- stable effect-queue behavior across runs (where feasible)
- preserve golden replay expectations (existing test remains green)

## 3) Non-goals (frozen)

- No changes to production/cost logic in this task
- No changes to effect resolver implementation in this task (tests may require minimal test harness plumbing only)

## 4) Inputs (frozen)

- Existing tests under `packages/game/test/*` (including golden replay)
- Resolver pipeline references in `AGENTS.md` and architecture docs
- Any new module registry from Task 0002 (if already landed)

## 5) Outputs (frozen)

- New tests (Vitest) for:
  - duplicate atom handler registration fails
  - deterministic ordering does not depend on JS insertion order
  - (optional) a small order proof for a representative hook path

## 6) Constraints (frozen)

- Tests must be deterministic and not depend on time, environment, or nondeterministic iteration
- Keep tests minimal and close to contract language (avoid overfitting to current code layout)

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-007 (Effect CPU Resolution Order)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-03-MEASURE-CPU.md` (resolution order)
- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-007, GR-012)
- AGENTS: 3.5, 3.6, 5.1-5.3

## 8) Acceptance Criteria (frozen)

- Invariant tests fail when:
  - duplicate registrations occur
  - ordering becomes nondeterministic
- All existing tests still pass

## 9) PR Checklist (frozen)

- [ ] Added deterministic invariants tests (no-override + ordering)
- [ ] Tests are stable (no flakiness)
- [ ] Existing golden replay test remains green
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

### Commands Run

TBD

