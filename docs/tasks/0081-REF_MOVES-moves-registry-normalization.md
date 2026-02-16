# Codex Task 0081 - REF_MOVES: Moves registry normalization (canonical order, config-only enablement)

**Date:** 2026-02-16
**Primary contract:** `AGENTS.md` (repo root)

## 0) Metadata (frozen)

- **Task ID:** 0081
- **Area:** `packages/game` moves assembly
- **Recommended execution order:** `0076 → 0077 → 0078 → 0079 → 0080 → 0081 → 0082 → 0083 → 0084 → 0085`
- **Risk:** Medium (ordering + expansion enablement + determinism)

## 1) Context (frozen)

`packages/game/src/moves.ts` currently mixes multiple concerns and expansion moves are assembled in a way that can allow silent overwrites and accidental nondeterministic ordering.

We want the same "deterministic or dead" posture as the resolver refactor series:

- canonical ordering is explicit and used everywhere
- enablement comes only from match config (not state slices, not "zone exists")

## 2) Goal (frozen)

Normalize move assembly so that:

- move module ordering is **explicitly canonical** (e.g. `['core','exp01','exp02','exp03']`) and never derived from object keys, map insertion order, or registration side effects
- expansion enablement is derived **only** from match config (single canonical source)
- assembly is deterministic and reviewable, without changing any move behavior

## 3) Non-goals (frozen)

- No gameplay semantics change (legality, costs, effects, state mutations)
- No changes to resolver behavior
- No "move logic rewritten into atoms" redesign in this task

## 4) Inputs (frozen)

- `packages/game/src/moves.ts`
- `packages/game/src/config.ts` (or canonical match config location)
- `packages/game/src/expansion-registry.ts` (enablement + ordering policy)
- expansion move sources (wherever they are defined today)

## 5) Outputs (frozen)

- A deterministic move assembly API that:
  - takes match config
  - returns an ordered list of enabled move sources/modules in canonical order
  - does not rely on object spreads for semantics

## 6) Constraints (frozen)

- Determinism: no hidden ordering dependencies (JS object key order, map insertion order)
- Enablement: match config only; no gating via `G.engine.attributes.*`, "zone exists", or other heuristics
- Keep changes minimal and localized to move assembly (not implementations)

## 7) Guardrails + Spec anchors (frozen)

### affected_guardrails

- GR-003 (Determinism Contract)
- GR-005 (No Phantom Moves)
- GR-006 (Pending Choice Gate)
- GR-012 (Match Config is Canonical)

### spec_anchor_refs

- `docs/architecture/ARCH-00-MASTERPLAN-GUARDRAILS.json` (GR-003, GR-006, GR-012)
- `docs/architecture/ARCH-01-ENGINE-CONTRACT.md` (engine-only rule execution + legality surface)

## 8) Acceptance Criteria (frozen)

- Moves exported for a given match config are identical to current behavior for all existing tests
- Module ordering equals the canonical list filtered by enablement (exact order)
- Negative: disabled expansions contribute nothing (no moves included) and are not inferred via state/zone existence

## 9) PR Checklist (frozen)

- [ ] Canonical order defined in one place and used by move assembly
- [ ] Enablement derived only from match config (no state/zone heuristics)
- [ ] No gameplay semantics changed
- [ ] Tests pass
- [ ] `affected_guardrails` and `spec_anchor_refs` present

## 15) Execution Log (append-only)

### Work Summary

TBD

### Commands Run

TBD
