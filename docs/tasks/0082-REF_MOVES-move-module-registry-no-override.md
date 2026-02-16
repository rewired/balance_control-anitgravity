# Codex Task 0082 - REF_MOVES: MoveModuleRegistry (no override, deterministic duplicate errors)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0082
- **Area:** `packages/game` move assembly
- **Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`
- **Risk:** Medium-high (changes merge behavior; must be deterministic)

## 1) Context (frozen)

After Task 0081 establishes deterministic module ordering + config-only enablement, we need to eliminate silent overwrites entirely by assembling move maps through an explicit registry that rejects duplicates.

## 2) Goal (frozen)

Introduce a `MoveModuleRegistry` that:

- registers moves (`moveName -> fn`) from core + enabled expansion move modules
- rejects duplicate move keys (no override / no last-write-wins)
- throws deterministic errors (stable message + stable conflict listing order)

## 3) Non-goals (frozen)

- No changes to any move logic or signatures
- No rename of existing move keys
- No "override allowed" mode

## 4) Inputs (frozen)

- Output of Task 0071 (deterministic ordered module list)
- Current move exports (boardgame.io move map)

## 5) Outputs (frozen)

- `MoveModuleRegistry` implementation (location under `packages/game/src/` appropriate, avoiding circular deps)
- Move assembly uses registry output rather than object spread
- Deterministic error format for duplicates:
  - includes duplicate move key
  - includes conflicting module ids
  - lists conflicts in canonical module order (then move key sort if needed)

## 6) Constraints (frozen)

- Determinism: error messages must be stable across runs
- Enablement: core always enabled; expansion modules only when their canonical flag is `true`
- No behavior change when there are no duplicates

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-005 (No Phantom Moves)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-012)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (legal move surface)

## 8) Acceptance Criteria (frozen)

- Duplicate move keys are rejected with deterministic errors (unit test added in 0073)
- For valid configs, exported moves behave identically to before
- Disabled expansions register nothing

## 9) PR Checklist (frozen)

- [ ] Registry introduced; object-spread merges removed from assembly path
- [ ] No override policy enforced (duplicate key errors)
- [ ] Deterministic error format (stable message + stable listing order)
- [ ] Tests pass
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

### Commands Run

TBD
